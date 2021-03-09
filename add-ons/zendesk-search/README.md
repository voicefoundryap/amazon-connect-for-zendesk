# Overview and Installation
Zendesk search for Amazon Connect is an optional add-on to [Amazon Connect app for Zendesk](https://www.zendesk.com/apps/support/amazon-connect/?q=mkp_amazon). It enables driving the business logic of an either DTMF driven (classic IVR) or conversation driven (LEX bot) contact flow, based on search results from Zendesk Support API.

Add-on consists of a single lambda function which is called from a Connect contact flow and is passed-in parameters which contain the type of search and search values. It's possible to search users by detected phone number (CLI), entered user ID or custom user field, most recent open tickets for a given user, or anything else in Zendesk Support via search templates. 

Reference documentation will be available soon, for now you can explore a sample contact flow available in our [GitHub repository](https://github.com/voicefoundryap/amazon-connect-for-zendesk/tree/master/contact-flows).

To install this add-on, first fill in the installation parameters on the right and deploy. For help with obtaining Zendesk API token see the [this Zendesk help article](https://support.zendesk.com/hc/en-us/articles/226022787-Generating-a-new-API-token-).

When deployment completes note the lambda function name and white-list it in your Connect instance (under Contact flows menu section). 

That's it - you're now ready to use Zendesk Support search capabilities in your contact flows.