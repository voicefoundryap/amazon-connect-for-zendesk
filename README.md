# amazon-connect-for-zendesk
An integrated solution for Zendesk and Amazon Connect that combines advanced contact center capabilities with a sophisticated ticketing system, empowering teams with powerful tools for routing, tracking, prioritizing and solving customer service interactions.
## How to install and use
The Amazon Connect app for Zendesk Support is available on the [Zendesk marketplace↗](https://www.zendesk.com/apps/support/amazon-connect/). This is the official version which is regularly updated and released to the marketplace by VoiceFoundry via Zendesk. It contains the code and related assets within the Master branch of this repository. To learn how to install and use it in your Zendesk account please download our [Installation and User guide](docs/Amazon%20Connect%20App%20for%20Zendesk%20v2.1.2%20-%20Installation%20and%20User%20Guide.pdf).

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
