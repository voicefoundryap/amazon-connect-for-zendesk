const buildComment = (analysis) => {
    return 'Test analysis from Contact Lens for contact id: ' + analysis.CustomerMetadata.ContactId;
}

module.exports = buildComment;