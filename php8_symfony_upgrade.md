# Upgrading PHP & Symfony versions on a large project

## Why

- **Performance:** Improved speed and scalability.
- **Security:** Patching known vulnerabilities.
- **Compatibility:** Ensuring alignment with libraries and integrations.
- **Features:** Access to new functionalities.
- **Developer Productivity:** Enhanced tools and workflows.
- **Long-term Support:** Ensuring ongoing maintenance.
- **Community Support:** Access to active developer communities.
- **Future-proofing:** Adapting to evolving technology trends.
- **Ecosystem Alignment:** Integration with other technologies.
- **Regulatory Compliance:** Meeting industry standards and regulations.

## Plan

- **Check Compatibility:** Ensure Symfony and dependencies support PHP 8.
- **Backup:** Secure a backup of your project.
- **Update Dependencies:** Ensure all dependencies are PHP 8 compatible.
- **Check Deprecated Features:** Replace deprecated features.
- **Test Locally:** Validate compatibility and resolve issues.
- **CI Integration:** Include PHP 8 checks in CI/CD.
- **Rollout Plan:** Plan a phased deployment to production.
- **Monitor and Debug:** Monitor post-deployment for issues.

## Prerequisites:

- Docker configuration (change docker-compose PHP image version to 8)
- Composer requirement changes:
```json
"require": { "php": ">=7.4 | ~8.2" }
```
- Access to https://github.com/nfq-technologies to fork packages if needed
- PHP Compatibility Checker:
```bash
composer require squizlabs/php_codesniffer --dev
composer require phpcompatibility/php-compatibility @develop --dev
```
- Coordination with DevOps for infrastructure changes.

## PHP Compatibility Checker:

Let's say we have this `test.php` file somewhere in our project:

```php
<?php

$pieces = ['apple', 'banana', 'orange'];
$result = implode( $pieces, ","); // Deprecated usage of implode()

$connection = mysql_connect('localhost', 'username', 'password'); // Deprecated mysql_connect function
```

Running the PHP Compatibility Checker yields:

```bash
FILE: /home/project/src/www/backend/uploads/test.php
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
FOUND 1 ERROR AND 1 WARNING AFFECTING 2 LINES
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
4 | WARNING | Passing the $glue and $pieces parameters in reverse order to implode has been deprecated since PHP 7.4; $glue should be the first parameter and $pieces the second
6 | ERROR   | Extension 'mysql_' is deprecated since PHP 5.5 and removed since PHP 7.0; Use mysqli instead
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
```

This indicates necessary refactoring. We can use this tool to analyze our entire project files and vendor too. If the error occurs in our project - we can fix it locally, if the error is in vendor - we need to upgrade the package.

## Fixing vendors:

After running PHP Compatibility Checker in vendor dir, make a list of problematic packages:

```
symfony/symfony
laminas/laminas-validator 
maennchen/zipstream-php
phpunit/phpunit
consolibyte/quickbooks
aws/aws-crt-php
elasticsearch/elasticsearch
doctrine/dbal
tecnickcom/tc-lib-barcode
...
```

Find current versions and least stable versions of these packages. For example running `composer show` we can find our current versions:

```
symfony/symfony v4.4.35  
maennchen/zipstream-php 2.4.0
...
```

By going to packagist.org for each package, we can check the latest stable version for our needs. 
In case of symfony/symfony it was v6.3.8.
After getting all the neccessary versions, we can start upgrading the packages by requiring the needed version. Upgrade packages accordingly:

```bash
composer require symfony/symfony:v6.3.8
```

Running this command yields:
```bash
Problem 1
- Root composer.json requires symfony/symfony v6.3.8 -> satisfiable by symfony/symfony[v6.3.8].
- symfony/symfony v6.3.8 requires doctrine/event-manager ^1.2|^2 -> found doctrine/event-manager[1.2.0, 2.0.0] but the package is fixed to 1.1.1 (lock file version) by a partial update and that version does not match. Make sure you list it as an argument for the update command.
Problem 2
- jms/serializer-bundle is locked to version 2.4.4 and an update of this package was not requested.
- jms/serializer-bundle 2.4.4 requires php ^5.4|^7.0 -> your php version (8.2; overridden via config.platform, actual: 7.4.33) does not satisfy that requirement.
Problem 3
- laminas/laminas-mail is locked to version 2.15.1 and an update of this package was not requested.
- laminas/laminas-mail 2.15.1 requires php ^7.3 || ~8.0.0 || ~8.1.0 -> your php version (8.2; overridden via config.platform, actual: 7.4.33) does not satisfy that requirement.
Problem 4
- php-http/guzzle5-adapter is locked to version 2.0.0 and an update of this package was not requested.
- php-http/guzzle5-adapter 2.0.0 requires php ^7.0 -> your php version (8.2; overridden via config.platform, actual: 7.4.33) does not satisfy that requirement.
...
```

We need to examine each of these dependency packages and upgrade them before we can upgrade symfony/symfony. From previous example we can see there is a problem with `jms/serializer-bundle`:
```bash
- jms/serializer-bundle 2.4.4 requires php ^5.4|^7.0 -> your php version (8.2; overridden via config.platform, actual: 7.4.33) does not satisfy that requirement.
```

We can see that jms/serializer-bundle isnt compatible with our php version, so we have to upgrade it too. The process here is the same as before - note the package, go to packageist, see if we can upgrade it. 
Repeat the process untill all packages are upgraded. 


But what happens if the package is no longer maintained and the last version doesnt fit our needs? 
In that case we need to fork the repository and add our own functionality. 
To fork a repository on GitHub, follow these steps:

- **Visit the Repository**: Go to the repository you want to fork on GitHub. (https://github.com/consolibyte/quickbooks-php)
- **Find the Fork Button**: In the top-right corner of the repository's page, click the "Fork" button. This will create a copy of the repository in your GitHub account. (https://github.com/consolibyte/quickbooks-php/fork)
- **Select Destination**: If you're a member of multiple organizations or have multiple accounts, GitHub will prompt you to choose where to fork the repository. (technologies)
- **Wait for Fork to Complete**: GitHub will then start the forking process. Depending on the size of the repository, this may take a few moments.
- **Access Your Fork**: Once the forking process is complete, you'll be redirected to your forked repository. (https://github.com/technologies/quickbooks-php)


Now that we have our forked repository, we can clone it locally and add our functionality/fix deprecations:
```bash
git clone -b <branch_name> <repository_url>
```

In my case, i created `php8-support` branch for all forked repos. 
After making sure there are no more deprication notices / errors locally, we make a pull request and accept in github `https://github.com/technologies/quickbooks-php`

After the pull request is accepted, we can tell composer to use our forked package instead of the original one. 
Define the forked repo source and tell it to use a specific branch (`php8-support` is the branch created earlier): 

```json
"repositories": [
    {
        "type": "vcs",
        "url": "git@github.com:nfq-technologies/quickbooks-php.git"
    }
],
"require": {
    "consolibyte/quickbooks": "dev-php8-support"
}
```

Now that we have all the packages fixed, we can update them with `composer update php --with-all-dependencies`.

After all packages are updated, we check if all platform requirements are met with `composer check-platform-reqs`

```json
composer-runtime-api 2.2.2      success                                       
ext-bcmath           8.3.1      success                                       
ext-ctype            *          success provided by symfony/polyfill-ctype    
ext-curl             8.3.1      success                                       
ext-date             8.3.1      success                                       
ext-dom              20031129   success 
...
```

## Refactoring:

- Fix errors in tests (unit/integration/functional).
- Manually test the application. 
- Check logs for errors.

## Deployment:

- Make a pull request and deploy to stage.
- Manually test and monitor logs on the stage environment.
- Create a duplicate branch from master branch for rollback purposes.
- Deploy to production and repeat testing.
- Revert changes if necessary and fix locally.
