# Amazon-Connect-for-Zendesk
An integrated solution for Zendesk and Amazon Connect that combines advanced contact center capabilities with a sophisticated ticketing system, empowering teams with powerful tools for routing, tracking, prioritizing and solving customer service interactions.
## How to install and use
The Amazon Connect app for Zendesk Support is available on the [Zendesk marketplace↗](https://www.zendesk.com/apps/support/amazon-connect/). This is the official version which is regularly updated and released to the marketplace by VoiceFoundry via Zendesk. It contains the code and related assets within the Master branch of this repository. To learn how to install and use it in your Zendesk account please download our [Installation and User guide](docs/Amazon%20Connect%20App%20for%20Zendesk%20v2.1.2%20-%20Installation%20and%20User%20Guide.pdf).

### Add-ons
On top of the standard out of the box features that the app includes, there are extra features that you can install and enable to further enhance the functionality of the app.
#### Speech analysis using Contact Lens
Enable speech analysis using Contact Lens and have the following results attached to your tickets:
- Call transcription
- Customer and agent sentiment
- Categories based on rules set within Contact Lens
- Conversation characteristics

View the installation and user guide for speech analysis [here](www.google.com).
#### Pause and resume call recordings
The pause and resume feature allows agents to pause and resume a call recording during a call with a customer. This feature is useful when a customer is providing sensitive information over the phone.

View the installation and user guide for pause and resume [here](www.google.com).
#### Zendesk Search for Connect with the help of the Zendesk Support API
Zendesk Search for Amazon Connect is an optional add-on that enables driving the business logic of either DTMF driven (classic IVR) or conversation driven (LEX bot) contact flows, based on query results from the Zendesk Support API.

The following types of searches are supported:
- search for user by user ID
- search for user by caller’s phone number (CLI)
- search for user by custom Zendesk user fields
- search for ticket by ticket ID
- search for most recent open ticket of an identified user
- templated searches for other queries supported by the Zendesk API

The search is performed within a contact flow by calling a lambda function which is installed as part of the corresponding serverless application within the AWS Serverless Application Repository. This lambda in turn calls the Zendesk Support API with a specific search query, based on parameters passed from the contact flow.

View the installation and user guide for Zendesk Search for Connect [here](www.google.com).
## Open source
Since the app is open source you're free to make a fork of the repo, make modifications to it, and then do one of two things:
- make a private app and install it in your Zendesk account, or
- raise a pull request to contribute your changes to the official version
## Making and installing your private Zendesk app
After forking the repo into your GitHub account and making your desired changes to it, use your favorite zip archiver app to create a zip package containing the contents of the `/src` folder :
```
/assets
/translations
/manifest.json
```
Then install it as a private app in your Zendesk account, following [these instructions↗](https://support.zendesk.com/hc/en-us/articles/203662486-Managing-your-installed-apps#topic_x3y_r22_r5).
## Contributing to the marketplace version of the app
If you feel that your code or documentation change will benefit other users of the app please follow our [contributing guide](CONTRIBUTING.md).
