const express = require('express');
const hre = require("hardhat");
const app = express();

// Middleware to enable CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Middleware to parse JSON bodies
app.use(express.json());

// Example route to join the DAO
// Example route to join the DAO
// Example route to join the DAO
app.post('/join-dao', async (req, res) => {
    try {
        const { address } = req.body;

        // Connect to the deployed DAO contract
        const DAO = await hre.ethers.getContractFactory("DAO");
        const daoContract = await DAO.attach('0xEA6fA9d3c061b0957fDeeE5ec1132Cc730d7b2EB');

        // Connect to the deployed DAOtoken contract
        const DAOtoken = await hre.ethers.getContractFactory("DAOtoken");
        const tokenContract = await DAOtoken.attach('0x2ff97d56EC289DaC06e508cb4232A9b0e2454b40');

        // Get the current token balance of the new member
        const tokenBalanceBefore = await tokenContract.balanceOf(address);

        // Call the joinDAO function in the DAO contract
        await daoContract.joinDAO();

        // Get the updated token balance of the new member
        const tokenBalanceAfter = await tokenContract.balanceOf(address);

        // Calculate the tokens received by the new member
        const tokensReceived = tokenBalanceAfter.sub(tokenBalanceBefore);

        res.json({ message: 'Joined the DAO successfully', tokensReceived: tokensReceived.toString() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to join the DAO' });
    }
});






// Example route to fetch all proposals
app.get('/proposals', async (req, res) => {
    try {
        // Connect to the deployed DAO contract
        const DAO = await hre.ethers.getContractFactory("DAO");
        const daoContract = await DAO.attach('0xEA6fA9d3c061b0957fDeeE5ec1132Cc730d7b2EB');

        // Get the total number of proposals
        const proposalCount = await daoContract.proposalsCount();

        //check status on proposals
        await daoContract.proposalsStatus()

        // Fetch each proposal details and calculate votes
        const proposals = [];
        for (let i = 0; i < proposalCount; i++) {
            const proposal = await daoContract.proposals(i);

            let winningOption = null;
            if (proposal.isClosed) {
                const votesForA = proposal.votesForA.toString();
                const votesForB = proposal.votesForB.toString();
                if (votesForA > votesForB) {
                    winningOption = 'A';
                } else if (votesForA < votesForB) {
                    winningOption = 'B';
                } else {
                    winningOption = 'Tie';
                }
            }

            proposals.push({
                id: proposal.id.toString(),
                title: proposal.title,
                description: proposal.description,
                deadline: proposal.deadline.toString(),
                minimumVotes: proposal.minimumVotes.toString(),
                votesForA: proposal.votesForA.toString(),
                votesForB: proposal.votesForB.toString(),
                closed: proposal.isClosed,
                finished: proposal.finished,
                winningOption: winningOption,
            });
        }

        res.json({ proposals });
        console.log({ proposals });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch proposals' });
    }
});



// Example route to create a new proposal
app.post('/proposals', async (req, res) => {
    try {
        const { title, description, deadline, minimumVotes } = req.body;

        // Connect to the deployed DAO contract
        const DAO = await hre.ethers.getContractFactory("DAO");
        const daoContract = await DAO.attach('0xEA6fA9d3c061b0957fDeeE5ec1132Cc730d7b2EB');

        // Create the proposal
        await daoContract.createProposal(
            title,
            description,
            deadline,
            minimumVotes
        );

        res.json({ message: 'New proposal created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create a new proposal' });
    }
});

// Example route to submit a vote for a proposal
app.post('/proposals/:id/vote/:vote', async (req, res) => {
    try {
        const proposalId = req.params.id;
        console.log('proposalId ', proposalId)
        const voteOption = req.params.vote;
        console.log('voteOption ', voteOption)

        // Connect to the deployed DAO contract
        const DAO = await hre.ethers.getContractFactory("DAO");
        const daoContract = await DAO.attach('0xEA6fA9d3c061b0957fDeeE5ec1132Cc730d7b2EB');

        // Submit the vote for the specified proposal
        await daoContract.vote(proposalId, voteOption);

        res.json({ message: `Vote submitted for proposal ${proposalId}, option ${voteOption}` });
    } catch (error) {
        console.error('the error is  ', error);
        res.status(500).json({ error: 'Failed to submit the vote' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
