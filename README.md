# sc-inventory-tracker
Shopify Backend Developer Intern Challenge - Summer 2022
Inventory tracking web application made using NodeJS, Express and Mongoose/MongoDB. Database is hosted seperately so local database is not required.
Application started using Express Application Generator to create the skeleton program.

I chose to do the "Ability to asign/remove inventory items to a named group/collection". As demonstrated by the categories feature.

Project Demo is available at:

# Running the program locally
To run the program locally, you can follow these steps:
1. You can find node at https://nodejs.org/en/. Ubuntu users can use the following command
Double check that both node and npm are installed. Use the following commands to check in terminal/command prompt

>node -v

>npm -v

2. Download the code from the repository.
3. Navigate to the inventory-management folder in your terminal/command prompt.
4. Run the following to install all dependencies required for the program.

>npm install

5. You can now use

>npm run start

to start the program, then visit localhost:3000

# Additional Notes
-Categories and Brands need to be created before creating an item, they cannot be created at item creation. They can be created and item can be reassigned later.
-Tested manually, full unit testing suite to be implemented
