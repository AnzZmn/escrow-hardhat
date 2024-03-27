import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';
import server from './server';


const provider = new ethers.providers.Web3Provider(window.ethereum);
const abi = [{"inputs":[{"internalType":"address","name":"_arbiter","type":"address"},{"internalType":"address","name":"_beneficiary","type":"address"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"","type":"uint256"}],"name":"Approved","type":"event"},{"inputs":[],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"arbiter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"beneficiary","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"depositor","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"isApproved","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]
const contractResponse = await server.get('/data').catch((err)=> console.error("ERRRR",err))
export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}


function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();
  const [contract,  setContract] = useState([])
  const [addresses, setAddresses] = useState([])

  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send('eth_requestAccounts', []);

      setAccount(accounts[0]);
      setSigner(provider.getSigner());
    }

    getAccounts()
  }, [account, addresses]);

  useEffect(()=>{
    async function getContracts(){
      try {
        if(contractResponse){
          setAddresses(contractResponse.data)
        }
        console.log(addresses)
      } catch (error) {
        console.error("ERR",error)
      }
  }

  getContracts();

  })

  useEffect(() => {
    async function getContracts() {
      if (!signer) return;
  
      const contractPromises = addresses.map(async (address) => {
        const instance = new ethers.Contract(address, abi, signer);
        const balancePromise = provider.getBalance(instance.address);
        const arbiterPromise = instance.arbiter();
        const beneficiaryPromise = instance.beneficiary();
  
        // Use Promise.all to wait for all promises to resolve
        const [balance, arbiter, beneficiary] = await Promise.all([
          balancePromise,
          arbiterPromise,
          beneficiaryPromise,
        ]);
  
        return {
          address: instance.address,
          arbiter: arbiter.toString(),
          beneficiary: beneficiary.toString(),
          value: ethers.utils.formatEther(balance),
          handleApprove: async () => {
            instance.on('Approved', () => {
              document.getElementById(instance.address).className = 'complete';
              document.getElementById(instance.address).innerText = "✓ It's been approved!";
            });
  
            await approve(instance, signer);
          },
        };
      });
  
      // Wait for all contractPromises to resolve and then update the state
      const contracts = await Promise.all(contractPromises);
      setContract(contracts); // This should replace setContract([escrow]) to accumulate all contracts.
    }
  
    getContracts();
  }, [signer, addresses]);


  

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter = document.getElementById('arbiter').value;
    const value = ethers.utils.parseUnits(document.getElementById('ether').value,18);
    const escrowContract = await deploy(signer, arbiter, beneficiary, value);
    try {
      await server.post('/data',{
        contractAddress: escrowContract.address
      }).then((response)=> console.log(response.data))
      
    } catch (error) {
      console.error("EEEEEER",error)
    }
    
    console.log(addresses)

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: ethers.utils.formatEther(value),
      handleApprove: async () => {
        escrowContract.on('Approved', () => {
          document.getElementById(escrowContract.address).className =
            'complete';
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";
        });

        await approve(escrowContract, signer);
      },
    };

    setEscrows([...escrows, escrow]);
    
  }

  return (
    <>
      <div className="contract">
        <h1> New Contract </h1>
        <label>
          Arbiter Address
          <input type="text" id="arbiter" />
        </label>

        <label>
          Beneficiary Address
          <input type="text" id="beneficiary" />
        </label>

        <label>
          Deposit Amount (in ether)
          <input type="text" id="ether" />
        </label>

        <div
          className="button"
          id="deploy"
          onClick={(e) => {
            e.preventDefault();

            newContract();
          }}
        >
          Deploy
        </div>
      </div>

      <div className="existing-contracts">
        <h1> Existing Contracts </h1>
        <div id="container">
          {contract.map((escrow,index) => {
            return <Escrow key={index} {...escrow} />;
          })}
        </div>
        <div id="container">
          {escrows.map((escrow) => {
            return <Escrow key={escrow.address} {...escrow} />;
          })}
        </div>
      </div>
    </>
  );
}

export default App;
