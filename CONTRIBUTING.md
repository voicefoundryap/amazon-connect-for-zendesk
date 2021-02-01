# Contributing Guidelines
You're welcome to contribute to the Amazon Connect app for Zendesk Support. You can contribute towards bug fixes, new features and/or documentation updates.
## Branching strategy
The app repository has three main branches:
- **Master** corresponds to the version currently available on [Zendesk marketplace↗](https://www.zendesk.com/apps/support/amazon-connect/)
- **Release** is the branch that will get deployed to the marketplace at the next planned release date
- **Develop** contains changes for a future release (e.g. after the next planned release)

When the app is published on the marketplace the release branch is merged to master. After a successful merge the release branch is deleted. A new release branch is then created from develop and the process repeats itself.
Branches taken from the release branch need to be merged into both release and develop.
Occasionally, hotfixes can be branched straight from master and then merged into master, release and develop. In this case master gets immediately published to the marketplace. 
## Bug fixes
To submit a bug fix, please raise a bug report issue first. This will help us determine the merge target of pull requests which you'll need to raise. Most bug fixes will go into the release branch, although if you find a critical bug it may go straight into master. If a proposed fix is seen as an enhancement it may go to the develop branch instead. 
## New features
To submit code changes and documentation updates for a new feature please raise a feature request issue. Similar to the above, it will help us determine which target branch to use in your pull requests. Some feature requests will end up in the next release, some in a future release, others we may put into our backlog. Note that we may not accept all suggestions if we determine they may not benefit the majority of our customer base or due to some compliance, legal or other reason.
## Documentation
If you find spelling or grammatical erors in our documentation, or if you find a better way of explaining or wording something, please feel free to raise a pull request against the corresponding branch.

Note: As a contributor you have the responsibility to resolve any merge conflicts that may arise from your pull requests.
