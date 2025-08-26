import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LottoModule", (m) => {
  const lotto = m.contract("Lotto");

  return { lotto };
});
