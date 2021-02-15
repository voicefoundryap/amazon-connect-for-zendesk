
const findTickets = async (contacts) => {
    return [{
        contactId: contacts[0],
        ticketId: 1
    }];
};

const updateTicket = async (ticketId, comment) => {
    return true;
};


module.exports = {
    findTickets,
    updateTicket
};