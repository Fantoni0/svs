import { Contract, ContractReceipt } from "ethers";

export function parseEvent(
  txReceipt: ContractReceipt,
  contract: Contract,
  eventName: any
) {
  const unparsedEv = txReceipt.logs.find(
    // @ts-ignore
    (evInfo) => evInfo.topics[0] === contract.filters[eventName]().topics[0]
  );
  // @ts-ignore
  return contract.interface.parseLog(unparsedEv);
}

export function packAsNbytes(hexStr: string, n = 32) {
  if (hexStr.substring(0, 2) === "0x") {
    hexStr = hexStr.substring(2);
  }
  const words = Math.ceil(hexStr.length / (n * 2));
  const targetLength = words * (n * 2);
  const zeroes = "0".repeat(targetLength - hexStr.length);
  return "0x" + zeroes + hexStr;
}

export function mostFrequent(a: string[]) {
  a.sort();
  let mostFrequent = a[0];
  let prevMostFrequent = a[0];
  let maxCount = 1;
  let prevMax = 0;
  let currentCount = 1;
  let i: number;
  for (i = 1; i < a.length; i++) {
    if (a[i] === a[i - 1]) {
      currentCount++;
    } else {
      currentCount = 1;
    }

    if (currentCount >= maxCount) {
      prevMax = maxCount;
      maxCount = currentCount;
      prevMostFrequent = mostFrequent;
      mostFrequent = a[i - 1];
    }
  }
  if (prevMax === maxCount) {
    return "Draw";
  } else {
    return mostFrequent;
  }
}
