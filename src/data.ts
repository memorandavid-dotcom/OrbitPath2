/**
 * OrbitPath Data Store & Smart Contract CodeTemplates
 * Stellar Network & Soroban Integration Lab
 */

export interface Asset {
  code: string;
  issuer?: string;
  name: string;
  icon: string;
  type: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
  anchor: string;
  color: string;
  precision: number;
}

export interface AMMPool {
  id: string;
  assetA: string;
  assetB: string;
  reserveA: number;
  reserveB: number;
  feeBps: number;
}

export interface PathHop {
  asset: Asset;
  rate: number;
  poolId: string;
}

export interface OptimizedRoute {
  path: PathHop[];
  inputAmount: number;
  outputAmount: number;
  totalFees: number;
  priceImpact: number;
  savingsVsSwift: number;
  efficiency: number; // Percentage better than direct or alternative
}

// Default stellar assets (Standard Anchors + Native XLM)
export const STELLAR_ASSETS: Asset[] = [
  {
    code: 'XLM',
    name: 'Lumen (Native)',
    icon: '✦',
    type: 'native',
    anchor: 'SDF (Stellar Development Foundation)',
    color: 'bg-indigo-500 text-white',
    precision: 7,
  },
  {
    code: 'USDC',
    issuer: 'GCCI...CIRCLE',
    name: 'USD Coin',
    icon: '$',
    type: 'credit_alphanum4',
    anchor: 'Circle',
    color: 'bg-blue-600 text-white',
    precision: 7,
  },
  {
    code: 'EURC',
    issuer: 'GD7U...CIRCLE',
    name: 'Euro Coin',
    icon: '€',
    type: 'credit_alphanum4',
    anchor: 'Circle / SDF',
    color: 'bg-emerald-600 text-white',
    precision: 7,
  },
  {
    code: 'BRLT',
    issuer: 'GD6W...DECAB',
    name: 'Brazilian Real Token',
    icon: 'R$',
    type: 'credit_alphanum4',
    anchor: 'Decaf / JPM-BRL',
    color: 'bg-teal-500 text-white',
    precision: 7,
  },
  {
    code: 'ARS',
    issuer: 'GCJK...ANCLAP',
    name: 'Argentine Peso',
    icon: 'AR$',
    type: 'credit_alphanum4',
    anchor: 'Anclap',
    color: 'bg-sky-500 text-white',
    precision: 7,
  },
  {
    code: 'NGNT',
    issuer: 'GCOW...COWRIE',
    name: 'Nigerian Naira Token',
    icon: '₦',
    type: 'credit_alphanum4',
    anchor: 'Cowrie Exchange',
    color: 'bg-green-700 text-white',
    precision: 7,
  }
];

// Mock on-chain liquidity pools for Stellar DEX / AMM simulation
export const LIQUIDITY_POOLS: AMMPool[] = [
  // XLM Pools
  { id: 'pool_xlm_usdc', assetA: 'XLM', assetB: 'USDC', reserveA: 15000000, reserveB: 1500000, feeBps: 30 }, // XLM rate approx $0.10
  { id: 'pool_xlm_eurc', assetA: 'XLM', assetB: 'EURC', reserveA: 8000000, reserveB: 720000, feeBps: 30 },  // EUR approx 1.1x USD
  { id: 'pool_xlm_brlt', assetA: 'XLM', assetB: 'BRLT', reserveA: 5000000, reserveB: 2500000, feeBps: 30 }, // BRLT approx 5.0 per USD (0.5 XLM per BRL)
  { id: 'pool_xlm_ars', assetA: 'XLM', assetB: 'ARS', reserveA: 3000000, reserveB: 270000000, feeBps: 30 }, // ARS rate
  { id: 'pool_xlm_ngnt', assetA: 'XLM', assetB: 'NGNT', reserveA: 4000000, reserveB: 6000000000, feeBps: 30 }, // NGNT rate

  // Stablecoin Cross-pools (Direct or slightly correlated)
  { id: 'pool_usdc_eurc', assetA: 'USDC', assetB: 'EURC', reserveA: 2000000, reserveB: 1820000, feeBps: 10 }, // 0.1% low-fee stable pool
  { id: 'pool_usdc_brlt', assetA: 'USDC', assetB: 'BRLT', reserveA: 1000000, reserveB: 5100000, feeBps: 20 },
  { id: 'pool_usdc_ars', assetA: 'USDC', assetB: 'ARS', reserveA: 500000, reserveB: 450000000, feeBps: 40 },
  { id: 'pool_usdc_ngnt', assetA: 'USDC', assetB: 'NGNT', reserveA: 800000, reserveB: 1200000000, feeBps: 40 },

  // BRLT / EURC
  { id: 'pool_eurc_brlt', assetA: 'EURC', assetB: 'BRLT', reserveA: 500000, reserveB: 2800000, feeBps: 30 }
];

/**
 * Calculates a list of valid routes from source to destination,
 * simulating AMM constant-product formula (x * y = k) for exact pricing and slippage.
 */
export function simulatePathfinding(
  sourceCode: string,
  destCode: string,
  amount: number,
  isExactSend: boolean = true
): OptimizedRoute[] {
  if (sourceCode === destCode) return [];

  const sourceAsset = STELLAR_ASSETS.find(a => a.code === sourceCode)!;
  const destAsset = STELLAR_ASSETS.find(a => a.code === destCode)!;

  // Let's pre-generate valid candidate routes:
  // 1. Direct pool (if exists)
  // 2. 1-hop intermediary (Source -> Intermediary -> Dest)
  // 3. 2-hop intermediary (Source -> Mid1 -> Mid2 -> Dest)
  
  const possibleIntermediaries = STELLAR_ASSETS.filter(
    a => a.code !== sourceCode && a.code !== destCode
  );

  const rawPaths: string[][] = [];

  // Direct Route
  if (getPool(sourceCode, destCode)) {
    rawPaths.push([sourceCode, destCode]);
  }

  // 1-Hop Routes
  possibleIntermediaries.forEach(mid => {
    if (getPool(sourceCode, mid.code) && getPool(mid.code, destCode)) {
      rawPaths.push([sourceCode, mid.code, destCode]);
    }
  });

  // 2-Hop Routes (Limited selection to prevent explosion, e.g., source -> XLM -> USDC -> dest)
  possibleIntermediaries.forEach(mid1 => {
    possibleIntermediaries.forEach(mid2 => {
      if (mid1.code !== mid2.code) {
        if (getPool(sourceCode, mid1.code) && getPool(mid1.code, mid2.code) && getPool(mid2.code, destCode)) {
          rawPaths.push([sourceCode, mid1.code, mid2.code, destCode]);
        }
      }
    });
  });

  const routes: OptimizedRoute[] = [];

  rawPaths.forEach(pathCodes => {
    // Traverse the path and calculate total rate, fees, slippage using constant product formula
    let currentAmount = amount;
    let totalFees = 0;
    let priceImpactSum = 0;
    const pathHops: PathHop[] = [];

    let ok = true;
    for (let i = 0; i < pathCodes.length - 1; i++) {
      const current = pathCodes[i];
      const next = pathCodes[i+1];
      const pool = getPool(current, next);

      if (!pool) {
        ok = false;
        break;
      }

      // Identify pool reserves relative to current token & next token
      const isCurrentA = pool.assetA === current;
      const rIn = isCurrentA ? pool.reserveA : pool.reserveB;
      const rOut = isCurrentA ? pool.reserveB : pool.reserveA;

      // Fees subtraction
      const feeFactor = 1 - pool.feeBps / 10000;
      const amountWithFee = currentAmount * feeFactor;
      totalFees += currentAmount * (pool.feeBps / 10000) * getConversionRate(current, 'USDC');

      // Constant product: (rIn + amountWithFee) * (rOut - amountOut) = rIn * rOut
      // amountOut = (rOut * amountWithFee) / (rIn + amountWithFee)
      const amountOut = (rOut * amountWithFee) / (rIn + amountWithFee);

      if (amountOut <= 0 || amountOut >= rOut) {
        ok = false;
        break;
      }

      // Slippage/Price impact relative to mid-price
      const spotPrice = rOut / rIn;
      const executionPrice = amountOut / currentAmount;
      const priceImpact = Math.max(0, (spotPrice - executionPrice) / spotPrice);
      priceImpactSum += priceImpact;

      const hopAsset = STELLAR_ASSETS.find(a => a.code === next)!;
      pathHops.push({
        asset: hopAsset,
        rate: executionPrice,
        poolId: pool.id
      });

      currentAmount = amountOut;
    }

    if (ok) {
      // Calculate SWIFT benchmark (approx $25 fixed + 2.5% FX markup)
      const originalValueInUsd = amount * getConversionRate(sourceCode, 'USDC');
      const swiftCost = 25 + originalValueInUsd * 0.025;
      const orbitCost = totalFees + (priceImpactSum * originalValueInUsd);
      const savings = Math.max(5.50, swiftCost - orbitCost);

      // Add arbitrary microscopic random noise to differentiate paths with same tokens
      const customSlightNoise = Math.sin(pathCodes.join('-').length) * 0.005;

      routes.push({
        path: pathHops,
        inputAmount: amount,
        outputAmount: currentAmount,
        totalFees: Math.max(0.001, totalFees),
        priceImpact: priceImpactSum / (pathCodes.length - 1),
        savingsVsSwift: parseFloat((savings + customSlightNoise * 10).toFixed(2)),
        efficiency: 100 - (priceImpactSum * 30) - (pathCodes.length * 0.2)
      });
    }
  });

  // Sort routes by highest output amount (best yield for the user)
  return routes.sort((a, b) => b.outputAmount - a.outputAmount);
}

// Helper to find a pool between two assets
export function getPool(asset1: string, asset2: string): AMMPool | undefined {
  return LIQUIDITY_POOLS.find(
    p => (p.assetA === asset1 && p.assetB === asset2) || (p.assetA === asset2 && p.assetB === asset1)
  );
}

// Static fallback conversions to USDC for standard calculations
export function getConversionRate(from: string, to: string): number {
  const ratesToUSD: { [key: string]: number } = {
    'XLM': 0.112,
    'USDC': 1.0,
    'EURC': 1.09,
    'BRLT': 0.18,
    'ARS': 0.0011,
    'NGNT': 0.00067
  };

  if (from === to) return 1;
  const usdRateFrom = ratesToUSD[from] || 1;
  const usdRateTo = ratesToUSD[to] || 1;
  return usdRateFrom / usdRateTo;
}

/**
 * Soroban Smart Contract Templates (Rust Boilerplate)
 * Highly detailed, compliant with the Soroban SDK (v20+) and Stellar specs.
 */
export const SOROBAN_CONTRACT_CODE = {
  routing_trigger: `// SPDX-License-Identifier: Apache-2.0
// OrbitPath Routing Execution Contract for Soroban (Stellar Smart Contracts)
// Designed to evaluate and execute cross-asset Path Payments atomically when threshold requirements are met.

#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec, Val};

// Struct to store path hop parameters
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PathHop {
    pub pool_address: Address,   // AMM Liquidity Pool Address
    pub asset_in: Address,       // Inbound asset token address
    pub asset_out: Address,      // Outbound asset token address
    pub fee_bps: u32,            // Fee basis points of this hop
}

// Storage keys
const SECRETS_ADMIN: Symbol = symbol_short!("ADMIN");
const SAVE_THRESHOLD: Symbol = symbol_short!("THRESH");

#[contract]
pub struct OrbitPathRouter;

#[contractimpl]
impl OrbitPathRouter {
    /// Initializes the OrbitPath router with an admin and basic cost-saving threshold.
    pub fn initialize(env: Env, admin: Address, min_saving_usd_bps: u32) {
        assert!(!env.storage().instance().has(&SECRETS_ADMIN), "Already initialized");
        env.storage().instance().set(&SECRETS_ADMIN, &admin);
        env.storage().instance().set(&SAVE_THRESHOLD, &min_saving_usd_bps);
    }

    /// Evaluates if a path routing opportunity meets the cost-saving requirements on-chain.
    /// Returns (is_optimal, estimated_output, routing_efficiency)
    pub fn evaluate_opportunity(
        env: Env,
        source_amount: i128,
        expected_min_dest: i128,
        path: Vec<PathHop>
    ) -> (bool, i128, u32) {
        let mut current_amount = source_amount;
        let mut total_slippage_bps: u32 = 0;

        // Iterate through all hops atomically to simulate execution price
        for i in 0..path.len() {
            let hop = path.get(i).unwrap();
            
            // On-chain check: Query the liquidity pool's reserves
            // This interacts with Stellar's standard AMM pool structure or smart contract liquidity pool
            let (reserve_in, reserve_out) = Self::query_pool_reserves(&env, &hop.pool_address, &hop.asset_in);
            
            if reserve_in == 0 || reserve_out == 0 {
                return (false, 0, 0);
            }

            // Apply constant product formula: (reserve_in + amount_in) * (reserve_out - amount_out) = reserve_in * reserve_out
            // Account for pool fees: standard basis points deduction
            let fee_factor = 10000 - hop.fee_bps;
            let amount_in_with_fee = (current_amount * fee_factor as i128) / 10000;
            
            let numerator = amount_in_with_fee * reserve_out;
            let denominator = reserve_in + amount_in_with_fee;
            let amount_out = numerator / denominator;

            // Compute slippage for efficiency index
            let spot_price_bps = ((reserve_out * 10000) / reserve_in) as u32;
            let exec_price_bps = ((amount_out * 10000) / current_amount) as u32;
            if spot_price_bps > exec_price_bps {
                total_slippage_bps += spot_price_bps - exec_price_bps;
            }

            current_amount = amount_out;
        }

        let meets_slippage_limit = current_amount >= expected_min_dest;
        
        // Efficiency Score starts at 10000 (100.00%) and reduces based on slippage and hops
        let base_efficiency = 10000;
        let penalty = total_slippage_bps + (path.len() * 150) as u32;
        let routing_efficiency = if base_efficiency > penalty {
            base_efficiency - penalty
        } else {
            0
        };

        (meets_slippage_limit, current_amount, routing_efficiency)
    }

    /// Atomically triggers a strict-send path payment.
    /// This utilizes Stellar Soroban native token integrations to route assets.
    pub fn execute_routing(
        env: Env,
        user: Address,
        source_asset: Address,
        dest_asset: Address,
        amount_in: i128,
        min_amount_out: i128,
        path: Vec<PathHop>
    ) -> i128 {
        // Authenticate the user initiating the transaction
        user.require_auth();

        // 1. Double check optimality on-chain to prevent frontrunning
        let (is_optimal, simulated_out, _) = Self::evaluate_opportunity(
            env.clone(),
            amount_in,
            min_amount_out,
            path.clone()
        );

        assert!(is_optimal, "Market conditions shifted: path is no longer optimal");
        assert!(simulated_out >= min_amount_out, "High slippage detected: output is below minimum");

        // 2. Pull the source token from the user's wallet into this router contract
        // (Assumes standard CEP-41 token or native SAC allowance is established)
        Self::transfer_token(&env, &source_asset, &user, &env.current_contract_address(), amount_in);

        // 3. Atomically chain swap operations across pools
        let mut current_token = source_asset;
        let mut current_balance = amount_in;

        for i in 0..path.len() {
            let hop = path.get(i).unwrap();
            
            // Execute trade directly on the destination AMM Pool contract
            let received_amount = Self::swap_on_pool(
                &env,
                &hop.pool_address,
                &current_token,
                &hop.asset_out,
                current_balance
            );

            current_token = hop.asset_out;
            current_balance = received_amount;
        }

        // 4. Pay out the finalized destination asset back to the user
        Self::transfer_token(&env, &dest_asset, &env.current_contract_address(), &user, current_balance);

        // Emit trace log event for off-chain indexing
        env.events().publish(
            (Symbol::new(&env, "orbitpath_swap"), user),
            (amount_in, current_balance)
        );

        current_balance
    }

    // --- Private Helper Functions Mocked/Staged for Production Integration ---

    fn query_pool_reserves(_env: &Env, _pool: &Address, _asset_in: &Address) -> (i128, i128) {
        // Real-world logic would call the target AMM Contract's 'get_reserves' method
        // e.g. env.invoke_contract::<(i128, i128)>(pool, &Symbol::new(env, "get_reserves"), vec![])
        // For mockup validation, we return standard simulated values
        (10_000_000_000_000, 1_000_000_000_000)
    }

    fn transfer_token(env: &Env, token: &Address, from: &Address, to: &Address, amount: i128) {
        // Invoke standard Stellar Asset Contract 'transfer' (SAC conforms to CEP-41 / ERC-20 standard)
        let _: Val = env.invoke_contract(
            token,
            &Symbol::new(env, "transfer"),
            soroban_sdk::vec![env, from.to_val(), to.to_val(), amount.to_val()]
        );
    }

    fn swap_on_pool(env: &Env, pool: &Address, _asset_in: &Address, _asset_out: &Address, amount_in: i128) -> i128 {
        // Swaps token on target pool and returns received output amount
        // In production, this invokes the AMM pool directly:
        // env.invoke_contract::<i128>(pool, &Symbol::new(env, "swap"), vec![env, amount_in.to_val(), ...])
        let fee_bps = 30; // standard 0.3%
        let output = (amount_in * (10000 - fee_bps)) / 10000;
        output
    }
}`,

  cargo_toml: `[package]
name = "orbitpath-router"
version = "0.1.0"
edition = "2021"
description = "OrbitPath Intelligent Cross-Border Path Router smart contract for Soroban"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
soroban-sdk = "20.0.0"

[profile.release]
opt-level = "z"
overflow-checks = true
lto = true
codegen-units = 1
panic = "abort"
`
};

/**
 * Stellar SDK Boilerplate Code Generators
 * Demonstrates stellar-sdk instantiation & PathPaymentStrictReceive operations
 */
export function generateSDKCode(
  sourceAsset: Asset,
  destAsset: Asset,
  sendMax: string,
  destAmount: string,
  intermediaries: Asset[]
): string {
  const isSourceNative = sourceAsset.type === 'native';
  const isDestNative = destAsset.type === 'native';

  const sourceAssetDefinition = isSourceNative
    ? 'const sourceAsset = Asset.native();'
    : `const sourceAsset = new Asset(
  '${sourceAsset.code}',
  '${sourceAsset.issuer || 'G...'}'
);`;

  const destAssetDefinition = isDestNative
    ? 'const destAsset = Asset.native();'
    : `const destAsset = new Asset(
  '${destAsset.code}',
  '${destAsset.issuer || 'G...'}'
);`;

  const pathArrayCode = intermediaries.length === 0
    ? 'const path = [];'
    : `const path = [
  ${intermediaries.map(asset => {
    if (asset.type === 'native') return 'Asset.native()';
    return `new Asset('${asset.code}', '${asset.issuer || 'G...'}')`;
  }).join(',\n  ')}
];`;

  return `import { 
  Server, 
  Keypair, 
  TransactionBuilder, 
  Networks, 
  Asset, 
  Operation 
} from 'stellar-sdk';

/**
 * Executes an OrbitPath optimized cross-border payment using Stellar Path Payments.
 * Specifically leverages PathPaymentStrictReceive: specifying the exact recipient amount,
 * while setting a strict sending threshold (SendMax) to protect against slippage.
 */
async function executeOrbitPathPayment() {
  // 1. Initialize Stellar Server (Horizon) pointing to Mainnet or Testnet
  const server = new Server('https://horizon.stellar.org');
  
  // 2. Establish sending Keypair
  const senderSeed = 'S...'; // Replace with secured secret key / wallet provider
  const senderKeypair = Keypair.fromSecret(senderSeed);
  const destinationAddress = 'GDST...RECIPIENT'; // Final recipient or regional anchor

  // 3. Define source and destination assets
  ${sourceAssetDefinition}
  ${destAssetDefinition}

  // 4. Set up intermediate routing path identified by OrbitPath engine
  ${pathArrayCode}

  try {
    // 5. Load the sender account to retrieve the current sequence number
    const account = await server.loadAccount(senderKeypair.publicKey());

    // 6. Build the transaction with a PathPaymentStrictReceive operation
    const transaction = new TransactionBuilder(account, {
      fee: await server.fetchBaseFee(),
      networkPassphrase: Networks.PUBLIC,
    })
      .addOperation(
        Operation.pathPaymentStrictReceive({
          // The maximum amount of source asset you are willing to spend
          sendMax: '${parseFloat(sendMax).toFixed(2)}',
          
          // The asset you are sending
          sendAsset: sourceAsset,
          
          // The final destination address
          destination: destinationAddress,
          
          // The asset the recipient will receive
          destAsset: destAsset,
          
          // The exact amount of destAsset the recipient must receive
          destAmount: '${parseFloat(destAmount).toFixed(2)}',
          
          // The intermediate assets (hops) through which to route the payment
          path: path,
        })
      )
      // Standard Stellar 3-minute timeout window
      .setTimeout(180)
      .build();

    // 7. Sign and submit the transaction to the Stellar Horizon network
    transaction.sign(senderKeypair);
    
    console.log('Submitting OrbitPath Payment to Horizon...');
    const result = await server.submitTransaction(transaction);
    
    console.log('Transaction executed successfully! Ledger:', result.ledger);
    console.log('Tx Hash:', result.hash);
    return result;
  } catch (error) {
    console.error('OrbitPath transfer failed:', error);
    throw error;
  }
}`;
}
