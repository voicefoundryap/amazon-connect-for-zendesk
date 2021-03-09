# Overview and Installation
Zendesk search for Amazon Connect is an optional add-on to the [Amazon Connect app for Zendesk](https://www.zendesk.com/apps/support/amazon-connect/?q=mkp_amazon). It enables further driving the business logic of either DTMF driven (classic IVR) or conversation driven (LEX bot) contact flows, based on search results from the Zendesk Support API.

This add-on consists of a single lambda function which is called from a Connect contact flow and is passed-in parameters which contain the type of search and search values. It's possible to search users by their detected phone number (CLI), the entered user ID, custom user fields within Zendesk, the most recent open ticket for a given user, or anything else in Zendesk Support via search templates. 

To install this add-on, first fill in the installation parameters on the right and deploy the stack. For help with obtaining a Zendesk API token see the [this Zendesk help article](https://support.zendesk.com/hc/en-us/articles/226022787-Generating-a-new-API-token-).

When the deployment is complete white-list the lambda function that was created during the deployment in your Connect instance (under the `Contact flows` menu section). 

You can view the full list of detailed installation steps here (link yet to be provided).

We have also provided a sample contact flow in our [GitHub repository](https://github.com/voicefoundryap/amazon-connect-for-zendesk/tree/release/contact-flows) to give you a better understanding of the search capabilities this lambda function provides.
