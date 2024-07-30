This is a web application on the following tech stack: Node.js, React, Express, SQLlite3, and Elastic Search

Note: the database has been deleted to share the application in a public repository. The database script backend/database/database.js does the work required to initialize the database with the required tables and columns. 

The web application will detect if either the database (with or without credentials) is present or if the database is not present. If the credentials are not present, the application will load a Setup page to allow the user to enter the Black Duck server URL and the API Token Key, validate them against the /api/authenticate endpoint, and then save the credentials encrypted in the Database. 

![Setup Form Screenshot](https://github.com/snps-steve/Component_Licenses_and_Terms_colt/blob/master/Colt_SetupForm.png)

Once valid credentials exist, the application will skip the setup page and directly load the License List page. In this version of Colt, the application does not automatically start to fetch and seed the licenses table. Instead, the user needs to hit the button "Seed Licenses and Terms". The application will start to load the licenses after which the page will refresh after X seconds. The license terms will continue to load in the background. The loading of license data is tied to the pagination function. The application will load whatever the user does from a pagination perspective (load 10, load 50, navigate to the next 50, etc).  

![License List Screenshot](https://github.com/snps-steve/Component_Licenses_and_Terms_colt/blob/master/Colt_LicenseList.png)

Functions and their purpose: 
- Load Licenses: if the user feels compelled to manually reload the licenses on the page (same can be done with a simple page refresh).
- Seed Licenses and Terms: if the database tables that hold the licenses and terms are empty, this is required.
- Clear Licenses (deletes all license and term data; does not clear any credentials)
- Clear Credentials (deletes the URL and API Token Key)
- Search bar: use Elastic Search to search through the license and term data (not sure how well it works for terms)

Note: Colt uses Helmet to protect against well-known web application based vulnerabilities.  
