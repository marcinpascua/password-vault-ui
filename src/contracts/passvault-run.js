import { Contract, ElectrumNetworkProvider, TransactionBuilder } from "cashscript"
import { addressToPkhash } from "../lib/common.js"
// if 'with' doesn't work, try 'assert'
import PasswordVaultArtifact from "./PasswordVault.json" with { type: 'json' }

const provider = new ElectrumNetworkProvider("mainnet")
const constructorArgs = [
    4_700n,
    addressToPkhash("bitcoincash:qrnpj0uzanjt7xg8kzcse0e6jecpkfv5aqd2uckkrl"),
    'benedictbayot'
] 

const contract = new Contract (
    PasswordVaultArtifact,
    constructorArgs,
    {provider, addressType: "p2sh32"}

)
console.log(contract.address);

const utxos = await contract.getUtxos()
console.log(utxos);

//create transaction builder
const transactionBuilder = new TransactionBuilder({ provider, addressType: "p2sh32" })

const utxo = utxos[0]
transactionBuilder.addInput(
    utxo,
    contract.unlock.claim("benedictbayot")
)

transactionBuilder.addOutput({
    amount:4700n,
    to: "bitcoincash:qrnpj0uzanjt7xg8kzcse0e6jecpkfv5aqd2uckkrl"
})

const remaining = utxo.satoshis - 4700n -300n 
if (remaining > 546n){
    transactionBuilder.addOutput({
        to:contract.address,
        amount: remaining
    })
}

const result = await transactionBuilder.send()
console.log(result)
//node src/contracts/passvault-run.js