<template>
  <div class="page-container">
    <div class="text-h5 title">{{ message }}</div>

    <div class="q-pa-md q-mt-md q-gutter-md">
      <q-input v label="Payout" v-model="payout" outlined/>
      <q-input v label="Address" v-model= "ownerAddress" outlined/>
      <q-input v label="Passcode" v-model= "passcode" outlined/>

      <q-btn label="Create" class="btn" @click="createContract"/>
    

    <div v-if="contract">
      {{ contract.address }} 
      <img :src="qrCodeImg"/>
      <p class="bal">Balance: {{ balance }}</p>
      <q-btn label="fetch balance" @click="fetchBalance()"/>
      <q-dialog v-model="isFetching">
        <div class="q-bg-white q-pa-md">Fetching balance<q-spinner/>
        </div>
      </q-dialog>
    </div>
    </div>
 </div>
    <div class="page-container q-pa-md q-gutter-md">
      <p class="title text-h5">Claim from Vault</p>
      <div v-if="claimTxid">
        Claim Transaction ID: {{ claimTxid }}
        <q-btn label="View in explorer" :href="'https://explorer.bch.ninja/tx/' + claimTxid" target="_blank"/>
      </div>
      <div v-if="claimError">
        Claim Error: {{ claimError }}
      </div>
      
      <q-input v label="Recipient Address" v-model= "claimRecipient" outlined/>
      <q-input v label="Passcode" v-model= "claimPasscode" outlined />
      <q-btn class="btn" label="Claim" @click="claimFromvault"/>
    
         <q-dialog v-model="isClaiming">
        <q-card>
          <q-card-section>
            Claiming from vault
            <q-spinner/>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
</template>

<script setup>
import { Contract, ElectrumNetworkProvider, TransactionBuilder } from 'cashscript';
import { addressToPkhash } from "src/lib/common.js"
import PasswordVaultArtifact from "src/contracts/PasswordVault.json" with { type: 'json' }
import { ref } from 'vue';
import {onMounted} from 'vue';

import QRCode from 'qrcode';

const message = ref('Create Contract');
const payout = ref('');
const ownerAddress = ref('');
const passcode = ref('');

const contract = ref('');

function createContract() {
    const provider = new ElectrumNetworkProvider("mainnet")
    const constructorArgs = [
      BigInt(payout.value),
      addressToPkhash(ownerAddress.value),
      passcode.value,
    ] 

    contract.value = new Contract (
      PasswordVaultArtifact,
      constructorArgs,
      {provider, addressType: "p2sh32"}

)
}

onMounted(function () {
  payout.value = 4700n;
  ownerAddress.value = "bitcoincash:qrnpj0uzanjt7xg8kzcse0e6jecpkfv5aqd2uckkrl";
  passcode.value = "benedictbayot";
})

const balance = ref()
const isFetching =ref(false)
async function fetchBalance() {
  isFetching.value = true 
  balance.value = await contract.value.getBalance()
  isFetching.value = false 
}

const qrCodeImg = ref();
async function generateAddressQrCode() {
  qrCodeImg.value = await QRCode.toDataURL(contract.value.address);
}

const claimRecipient =ref('')
const claimPasscode =ref('')
const claimTxid = ref('')

const isClaiming = ref(false);
const claimError = ref('');

async function claimFromvault() {
  try {
    isClaiming.value = true;
    const provider = new ElectrumNetworkProvider("mainnet")
    const transactionBuilder = new TransactionBuilder({provider})
    const utxos = await contract.value.getUtxos()
    const utxo = utxo[0]

    transactionBuilder.addInput(
      utxo,
      contract.value.claim(claimPasscode.value)
    )

  transactionBuilder.addOutput({
    to: claimRecipient.value,
    amount: BigInt(payout.value)}
  )

  const remaining = utxo.satoshis - 300n - BigInt(payout.value)
  if (remaining > 546n) {
    transactionBuilder.addOutput({
      to: contract.value.address,
      amount: remaining
    })
  }
     const transactionDetails = await transactionBuilder.send();
    claimTxid.value = transactionDetails.txid;
    claimError.value = '';
  } catch(error) {
    claimError.value = String(error);
  } finally {
    isClaiming.value = false;
  }
  
}




</script>
<style scoped>
.page-container {
  max-width: min(600px, 95vw);
  padding: 16px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 16px;
  border: gray 1px solid;
  border-radius: 10px;
  

}

.bal{
  color:blue;
  font-weight:bold;
}

.title{
  display: flex;
  justify-content: center;
  font-weight: bold;
  color: gray
}

.claimContract{
  margin-top:20px;
  /* border: black 1px solid; */
}

.q-btn{
  background-color: blue;
  color:white;
}
.q-btn:hover{
   background-color: white;
  color:black;
  }
</style>


