import { paymentMiddleware } from "@x402/express";
import { x402ResourceServer } from "@x402/core/server";
import { x402Facilitator } from "@x402/core/facilitator";
import { registerExactEvmScheme as registerExactEvmFacilitatorScheme } from "@x402/evm/exact/facilitator";
import { ExactEvmScheme as ExactEvmServerScheme } from "@x402/evm/exact/server";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { createPublicClient, createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

class LocalFacilitatorClient {
  constructor(facilitator) {
    this.facilitator = facilitator;
  }

  async verify(paymentPayload, paymentRequirements) {
    return this.facilitator.verify(paymentPayload, paymentRequirements);
  }

  async settle(paymentPayload, paymentRequirements) {
    return this.facilitator.settle(paymentPayload, paymentRequirements);
  }

  async getSupported() {
    return this.facilitator.getSupported();
  }
}

function mustGetEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function createViemFacilitatorSigner({ rpcUrl, agentPrivateKey }) {
  const account = privateKeyToAccount(agentPrivateKey);

  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl),
  });

  // Combine public + wallet capabilities into the shape x402 expects.
  return toFacilitatorEvmSigner({
    address: account.address,
    readContract: (args) => publicClient.readContract(args),
    verifyTypedData: (args) => publicClient.verifyTypedData(args),
    writeContract: (args) => walletClient.writeContract(args),
    sendTransaction: (args) => walletClient.sendTransaction(args),
    waitForTransactionReceipt: (args) => publicClient.waitForTransactionReceipt(args),
    getCode: async ({ address }) => {
      const bytecode = await publicClient.getBytecode({ address });
      return bytecode ?? undefined;
    },
  });
}

export async function createX402Middleware() {
  const chainId = Number(process.env.CHAIN_ID || "8453");
  if (chainId !== 8453) {
    throw new Error(`Phase 1 requires Base mainnet (CHAIN_ID=8453). Got: ${chainId}`);
  }

  const rpcUrl = mustGetEnv("RPC_URL");
  const agentPrivateKey = mustGetEnv("AGENT_PRIVATE_KEY");

  const facilitatorSigner = createViemFacilitatorSigner({ rpcUrl, agentPrivateKey });
  const agentAddress = facilitatorSigner.getAddresses()[0];

  // Local facilitator: verifies + settles on-chain directly (no CDP, no API keys).
  const facilitator = new x402Facilitator();
  registerExactEvmFacilitatorScheme(facilitator, {
    signer: facilitatorSigner,
    networks: ["eip155:8453"],
  });

  const facilitatorClient = new LocalFacilitatorClient(facilitator);

  // Resource server: generates payment requirements and routes verify/settle to our local facilitator.
  const resourceServer = new x402ResourceServer(facilitatorClient).register(
    "eip155:8453",
    new ExactEvmServerScheme()
  );

  await resourceServer.initialize();

  const routes = {
    "GET /paid/hello": {
      accepts: {
        scheme: "exact",
        network: "eip155:8453",
        payTo: agentAddress,
        price: "$0.01",
      },
      description: "Paid hello-world endpoint",
      mimeType: "application/json",
    },
  };

  const inner = paymentMiddleware(routes, resourceServer, undefined, undefined, false);

  // Express 4 safety: convert async throw/reject into next(err) so we never crash the process.
  const middleware = (req, res, next) => {
    Promise.resolve(inner(req, res, next)).catch(next);
  };

  return { middleware, agentAddress };
}

