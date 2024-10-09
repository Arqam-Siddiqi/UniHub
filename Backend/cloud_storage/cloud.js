const {Storage} = require('megajs');
const path = require('path');
const fs = require('fs');

let storage;

const initializeStorage = async () => {
  try {

    storage = await new Storage({
      email: 'mirzasaad363@gmail.com',
      password: 'madeeha1984'
    }).ready;
    
    console.log("Successfully logged into Mega.");
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

initializeStorage();

//first we will save the file recieved/ assume for noe the path given below is the path of this saved file
//destination will be the path to the directory on the cloud in which u want to save the file, e.g: repo1/newfolder2/newfolder3 where repo1 is in the root directory 
const upload = async (destination, fileBuffer, fileName) => {

  if(!storage){
    console.log("Mega Storage is not initialized.");
    return;
  }

  return new Promise(async (resolve, reject) => {

    try {
      // const stats = fs.statSync(pathOfFile);
      // const fileSize = stats.size; 
    
      // const readstream = fs.createReadStream(pathOfFile);
      
      const t1 = performance.now();

      await storage.root.navigate(destination).upload({
        name: fileName,
        size: fileBuffer.length
      }, fileBuffer).complete.then(() => {
        const t2=performance.now();
        
        // readstream.destroy();

        // fs.unlinkSync(pathOfFile);

        console.log('Upload Complete.');
        console.log('Time taken to upload file: ', t2-t1 , 'ms.\n');
        resolve();
      })
      .catch((err) => reject(err));
     
    }
    catch (err) {
      console.error({"Error": err});
    }

  });
  
}

const importFile = async (pathToFile) => {

  if(!storage){
    console.log("Mega Storage is not initialized.");
    return;
  }

  return new Promise((resolve, reject) => {
    const wstream = fs.createWriteStream(path.basename(pathToFile));
    storage.root.find(path.basename(pathToFile), true).download().pipe(wstream);

    wstream.on('finish', () => {
      console.log(`File downloaded to ${pathToFile}`);
      resolve();
    });

    wstream.on('error', (error) => {
      console.error('Error writing file:', error);
      reject(error);
    });

  });
}

//pass flag=1 if making a folder within a folder that you made. Pass flag=0 if making a folder in root directory i.e making a new user repository.
const createFolder = async (name, folderPath, flag) => {

  if(!storage){
    console.log("Mega Storage is not initialized.");
    return;
  }

  try{
    let folder;
    if(flag == 1){
      folder = await storage.root.find(path.basename(folderPath), true).mkdir(name, (err) => {
        if (err) console.log('Error creating folder'); 
        else console.log('Folder created successfully');
      })
    }
    else{
      folder = await storage.root.mkdir(name, (err)=> {
        if(err) console.log('Error creating folder'); 
        else console.log('Folder created successfully')
      });
    }
  }
  catch(err){
    console.log('Error creating folder: ', err);
  }
  
}

//also works for folders
const deleteFileAndFolder = async (pathToFile) => {

  if(!storage){
    console.log("Mega Storage is not initialized.");
    return;
  }

  try{
    const data=await storage.root.find(path.basename(pathToFile), true).delete();  
    if(storage.root.find(path.basename(pathToFile), true).directory)
    console.log('Folder deleted successfully');  
    else
    console.log('File deleted successfully');
  }
  catch(err){
    if(storage.root.find(path.basename(pathToFile), true).directory)
    console.log('Error deleting folder: ', err);
    else console.log('Error deleting file', err);
  }
}


module.exports = {
  upload,
  importFile,
  createFolder,
  deleteFileAndFolder
}

// upload('folder', "C:/Users/Hp/Downloads/Testing.txt");
// await createFolder('f2', 'f3', 1);
// await importFile('Testing.txt');
// await deleteFileAndFolder('f3');
// await storage.close();



// const run = async () => {

  
  
//   return 'Done';
// }

// run().then(data => console.log(data));
