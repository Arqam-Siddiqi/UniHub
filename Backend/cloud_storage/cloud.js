const {Storage} = require('megajs');
const path = require('path');
const fs = require('fs');

const storage = new Storage({
  email: 'mirzasaad363@gmail.com',
  password: 'madeeha1984'
}, error => {
  if(error)
  return console.log('Login failed', err);
  else {
      console.log("Logged in successfully to Mega Cloud Storage.");
      
  }
}).ready

const upload = async (destination, pathOfFile) => {

  //first we will save the file recieved/ assume for noe the path given below is the path of this saved file
  //destination will be the path to the directory on the cloud in which u want to save the file, e.g: repo1/newfolder2/newfolder3 where repo1 is in the root directory 

  let fileSize;
  try {
    const stats = fs.statSync(pathOfFile);
    fileSize = stats.size; 
  
  } catch (err) {
      console.error('Error getting file stats:', err);
  }
  console.log(`File Size: ${fileSize}`);
  
  const readstream = fs.createReadStream(pathOfFile);
  
  const t1 = performance.now();

  console.log(destination);
  await storage.root.navigate(destination).upload({
    name: path.basename(pathOfFile),
    size: fileSize,
  }, readstream).complete
  
  const t2=performance.now();
  
  readstream.destroy();
  console.log('Upload Complete\nTime taken to upload file: ', t2-t1 , 'ms.' );
}

const importFile = async (pathToFile) => {
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

  })
}

//pass flag=1 if making a folder within a folder that you made. Pass flag=0 if making a folder in root directory i.e making a new user repository.
const createFolder = async (name, folderPath, flag) => {
  
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
