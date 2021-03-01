const commonUserFields = (user) => {
    const [first, last] = user.name.split(' ');
    return {
        zendesk_user: user.id,
        customer_name: user.name,
        customer_number: user.phone,
        external_id: user.external_id,
        user_name: first,
        user_surname: last,
        user_email: user.email,
        user_role: user.role,
        user_locale: user.locale,
        time_zone: user.iana_time_zone,
        organization: user.organization_id,
        suspended: user.suspended
    };
};

const commonTicketFields = (ticket) => {
    return {
        zendesk_ticket: ticket.id,
        zendesk_user: ticket.requester,
        ticket_subject: ticket.subject,
        ticket_status: ticket.status,
        ticket_brand: ticket.brand_id
    };
};

module.exports = {
    commonUserFields,
    commonTicketFields
};