const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('Reentrancy', () => {
    let deployer, bank, user
    let attackDeployer, attackerContract

    beforeEach(async () => {
        // Setup accounts
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        user = accounts[1]
        attackDeployer = accounts[2]

        const Bank = await ethers.getContractFactory("Bank", deployer)

        bank = await Bank.deploy()

        await bank.deposit({ value: ether(100) })
        await bank.connect(user).deposit({ value: ether(50) })

        const Attacker = await ethers.getContractFactory("Attacker", attackDeployer)
        attackerContract = await Attacker.deploy(bank.address)
    })

    describe('facilitates deposits and withdraws', () => {
        it('accepts deposits', async () => {
            //check deposit
            const deployerBalance = await bank.balanceOf(deployer.address)
            expect(deployerBalance).to.equal(ether(100))

            const userBalance = await bank.balanceOf(user.address)
            expect(userBalance).to.equal(ether(50))

        })

        it('accepts withdraws', async () => {
            await bank.withdraw()

            const deployerBalance = await bank.balanceOf(deployer.address)
            expect(deployerBalance).to.equal(ether(0))

            const userBalance = await bank.balanceOf(user.address)
            expect(userBalance).to.equal(ether(50))
        })

        it('allows attacker to drain funds from #withdraw()', async () => {
            console.log('*** Before ***')
            let balance = await ethers.provider.getBalance(bank.address)
            console.log('bank balance', ethers.utils.formatEther(balance))

            let attackerBalance = await ethers.provider.getBalance(attackDeployer.address)
            console.log('Attacker balance', ethers.utils.formatEther(attackerBalance))


            //Perform attack

            await attackerContract.attack({ value: balance })

            console.log('*** after ***')
            balance = await ethers.provider.getBalance(bank.address)
            console.log('bank balance', ethers.utils.formatEther(balance))

            attackerBalance = await ethers.provider.getBalance(attackDeployer.address)
            console.log('Attacker balance', ethers.utils.formatEther(attackerBalance))

            // expect(balance).to.equal(0)

        })
    })
})
