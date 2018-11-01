import {
  assetDataUtils,
  BigNumber,
  ContractWrappers,
  generatePseudoRandomSalt,
  orderHashUtils,
  signatureUtils,
  SignerType,
} from '0x.js';
import {
  Web3Wrapper,
} from '@0xproject/web3-wrapper';
import {
  providerEngine,
} from './utils/providerEngine';
import {
  PrintUtils,
} from './utils/printing';
import {
  DECIMALS,
  GANACHE_NETWORK_ID,
  NULL_ADDRESS,
  GAS_DEFAULT,
} from './utils/constants';
import {
  getRandomFutureDateInSeconds,
} from './utils/helpers';

/**
 * In this scenario, the maker creates and signs an order for selling ZRX for WETH.
 * This order has ZRX fees for both the maker and taker, paid out to the fee recipient.
 * The taker takes this order and fills it via the 0x Exchange contract.
 */
export async function scenarioAsync() {
  PrintUtils.printScenario('Fill Order with Fees');
  // Initialize the ContractWrappers, this provides helper functions around calling
  // 0x contracts as well as ERC20/ERC721 token contracts on the blockchain
  const contractWrappers = new ContractWrappers(providerEngine, { networkId: GANACHE_NETWORK_ID });
  // Initialize the Web3Wrapper, this provides helper functions around fetching
  // account information, balances, general contract logs
  const web3Wrapper = new Web3Wrapper(providerEngine);
  const [maker, taker, feeRecipient] = await web3Wrapper.getAvailableAddressesAsync();
  const zrxTokenAddress = contractWrappers.exchange.getZRXTokenAddress();
  const etherTokenAddress = contractWrappers.etherToken.getContractAddressIfExists();
  if (!etherTokenAddress) {
    throw new Error('Ether Token not found on this network');
  }
  const printUtils = new PrintUtils(
    web3Wrapper,
    contractWrappers,
    { maker, taker, feeRecipient },
    { WETH: etherTokenAddress, ZRX: zrxTokenAddress },
  );
  printUtils.printAccounts();

  // the amount the maker is selling in maker asset
  const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(5), DECIMALS);
  // the amount the maker wants of taker asset
  const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(0.1), DECIMALS);
  // the amount of fees the maker pays in ZRX
  const makerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(0.01), DECIMALS);
  // the amount of fees the taker pays in ZRX
  const takerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(0.01), DECIMALS);

  // 0x v2 uses hex encoded asset data strings
  // to encode all the information needed to identify an asset
  const makerAssetData = assetDataUtils.encodeERC20AssetData(zrxTokenAddress);
  const takerAssetData = assetDataUtils.encodeERC20AssetData(etherTokenAddress);

  // Approve the ERC20 Proxy to move ZRX for maker and taker
  const makerZRXApprovalTxHash = await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
    zrxTokenAddress,
    maker,
  );
  const takerZRXApprovalTxHash = await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
    zrxTokenAddress,
    taker,
  );
  // Allow the 0x ERC20 Proxy to move WETH on behalf of takerAccount
  const takerWETHApprovalTxHash = await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
    etherTokenAddress,
    taker,
  );
  // Convert ETH into WETH for taker by depositing ETH into the WETH contract
  const takerWETHDepositTxHash = await contractWrappers.etherToken.depositAsync(
    etherTokenAddress,
    takerAssetAmount,
    taker,
  );

  PrintUtils.printData('Setup', [
    ['Maker ZRX Approval', makerZRXApprovalTxHash],
    ['Taker ZRX Approval', takerZRXApprovalTxHash],
    ['Taker WETH Approval', takerWETHApprovalTxHash],
    ['Taker WETH Deposit', takerWETHDepositTxHash],
  ]);

  // Set up the Order and fill it
  const randomExpiration = getRandomFutureDateInSeconds();
  const exchangeAddress = contractWrappers.exchange.getContractAddress();

  // Create the order
  const order = {
    exchangeAddress,
    makerAddress: maker,
    takerAddress: NULL_ADDRESS,
    senderAddress: NULL_ADDRESS,
    feeRecipientAddress: feeRecipient,
    expirationTimeSeconds: randomExpiration,
    salt: generatePseudoRandomSalt(),
    makerAssetAmount,
    takerAssetAmount,
    makerAssetData,
    takerAssetData,
    makerFee,
    takerFee,
  };

  printUtils.printOrder(order);

  // Print out the Balances and Allowances
  await printUtils.fetchAndPrintContractAllowancesAsync();
  await printUtils.fetchAndPrintContractBalancesAsync();

  // Generate the order hash and sign it
  const orderHashHex = orderHashUtils.getOrderHashHex(order);
  const signature = await signatureUtils.ecSignOrderHashAsync(
    providerEngine,
    orderHashHex,
    maker,
    SignerType.Default,
  );
  const signedOrder = { ...order, signature };
  // Fill the Order via 0x Exchange contract
  const txHash = await contractWrappers.exchange.fillOrderAsync(
    signedOrder,
    takerAssetAmount,
    taker,
    {
      gasLimit: GAS_DEFAULT,
    },
  );
  const txReceipt = await web3Wrapper.awaitTransactionMinedAsync(txHash);
  printUtils.printTransaction('fillOrder', txReceipt, [
    ['orderHash', orderHashHex],
    ['takerAssetAmount', takerAssetAmount.toString()],
  ]);

  // Print the Balances
  await printUtils.fetchAndPrintContractBalancesAsync();

  // Stop the Provider Engine
  providerEngine.stop();
}

(async () => {
  try {
    if (!module.parent) {
      await scenarioAsync();
    }
  } catch (e) {
    console.log(e);
    providerEngine.stop();
    process.exit(1);
  }
})();