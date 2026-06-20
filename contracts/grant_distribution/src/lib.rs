#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Symbol, token};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Grant {
    pub id: u32,
    pub creator: Address,
    pub recipient: Address,
    pub target: i128,
    pub balance: i128,
    pub deadline: u64,
    pub released: bool,
    pub approved: bool,
    pub description: String,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Token,
    GrantCount,
    Grant(u32),
    Contribution(u32, Address),
}

#[contract]
pub struct GrantDistributionContract;

#[contractimpl]
impl GrantDistributionContract {
    pub fn initialize(env: Env, admin: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::GrantCount, &0u32);
    }

    pub fn create_grant(
        env: Env,
        creator: Address,
        recipient: Address,
        target: i128,
        deadline: u64,
        description: String,
    ) -> u32 {
        creator.require_auth();
        assert!(target > 0, "target must be greater than zero");
        assert!(deadline > env.ledger().timestamp(), "deadline must be in the future");

        let mut count: u32 = env.storage().instance().get(&DataKey::GrantCount).unwrap_or(0);
        count += 1;

        let grant = Grant {
            id: count,
            creator: creator.clone(),
            recipient: recipient.clone(),
            target,
            balance: 0,
            deadline,
            released: false,
            approved: false,
            description: description.clone(),
        };

        env.storage().persistent().set(&DataKey::Grant(count), &grant);
        env.storage().instance().set(&DataKey::GrantCount, &count);

        env.events().publish(
            (Symbol::new(&env, "grant_created"), count, creator),
            (recipient, target, deadline),
        );

        count
    }

    pub fn donate(env: Env, donor: Address, grant_id: u32, amount: i128) {
        donor.require_auth();
        assert!(amount > 0, "amount must be greater than zero");

        let grant_key = DataKey::Grant(grant_id);
        let mut grant: Grant = env.storage().persistent().get(&grant_key).expect("grant not found");

        assert!(!grant.released, "grant already released");
        assert!(env.ledger().timestamp() < grant.deadline, "grant deadline has passed");

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).expect("token not initialized");
        let token_client = token::Client::new(&env, &token_addr);

        token_client.transfer(&donor, &env.current_contract_address(), &amount);

        let contrib_key = DataKey::Contribution(grant_id, donor.clone());
        let current_contrib: i128 = env.storage().persistent().get(&contrib_key).unwrap_or(0);
        env.storage().persistent().set(&contrib_key, &(current_contrib + amount));

        grant.balance += amount;
        env.storage().persistent().set(&grant_key, &grant);

        env.events().publish(
            (Symbol::new(&env, "donation_received"), grant_id, donor),
            amount,
        );
    }

    pub fn approve_milestone(env: Env, grant_id: u32) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("admin not initialized");
        admin.require_auth();

        let grant_key = DataKey::Grant(grant_id);
        let mut grant: Grant = env.storage().persistent().get(&grant_key).expect("grant not found");

        assert!(!grant.released, "grant already released");
        grant.approved = true;

        env.storage().persistent().set(&grant_key, &grant);

        env.events().publish(
            (Symbol::new(&env, "grant_approved"), grant_id),
            (),
        );
    }

    pub fn claim_funds(env: Env, grant_id: u32) {
        let grant_key = DataKey::Grant(grant_id);
        let mut grant: Grant = env.storage().persistent().get(&grant_key).expect("grant not found");

        assert!(!grant.released, "grant already released");
        assert!(grant.balance >= grant.target, "funding target not met");
        assert!(grant.approved, "milestone not approved by admin");

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).expect("token not initialized");
        let token_client = token::Client::new(&env, &token_addr);

        token_client.transfer(&env.current_contract_address(), &grant.recipient, &grant.balance);

        grant.released = true;
        env.storage().persistent().set(&grant_key, &grant);

        env.events().publish(
            (Symbol::new(&env, "funds_released"), grant_id, grant.recipient.clone()),
            grant.balance,
        );
    }

    pub fn claim_refund(env: Env, grant_id: u32, donor: Address) {
        donor.require_auth();

        let grant_key = DataKey::Grant(grant_id);
        let mut grant: Grant = env.storage().persistent().get(&grant_key).expect("grant not found");

        assert!(!grant.released, "grant already released");
        assert!(env.ledger().timestamp() >= grant.deadline, "grant deadline has not passed yet");
        assert!(grant.balance < grant.target, "funding target was met, cannot refund");

        let contrib_key = DataKey::Contribution(grant_id, donor.clone());
        let amount: i128 = env.storage().persistent().get(&contrib_key).unwrap_or(0);
        assert!(amount > 0, "no contribution to refund");

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).expect("token not initialized");
        let token_client = token::Client::new(&env, &token_addr);

        token_client.transfer(&env.current_contract_address(), &donor, &amount);

        env.storage().persistent().set(&contrib_key, &0i128);

        grant.balance -= amount;
        env.storage().persistent().set(&grant_key, &grant);

        env.events().publish(
            (Symbol::new(&env, "refund_claimed"), grant_id, donor),
            amount,
        );
    }

    pub fn get_grant(env: Env, grant_id: u32) -> Option<Grant> {
        env.storage().persistent().get(&DataKey::Grant(grant_id))
    }

    pub fn get_grant_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::GrantCount).unwrap_or(0)
    }

    pub fn get_donor_amount(env: Env, grant_id: u32, donor: Address) -> i128 {
        env.storage().persistent().get(&DataKey::Contribution(grant_id, donor)).unwrap_or(0)
    }
}
