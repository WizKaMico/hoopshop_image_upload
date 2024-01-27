// const cron = require('node-cron');
// const bodyParser = require('body-parser');
// const express = require('express');
// const axios = require('axios');

// const app = express();
// const port = process.env.PORT || 3005;

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

// const accessToken = 'EAAWiGqtpC2kBOw0wU80FtVynC3uLQF1zXZCbSK9kI51dtOXjGNhJK1kVpWueU0fArrxrmaWmOdMzbh5PnpSoeTZBatFa4PtvrDxuZBprqRLSMKqpvulYnLb6w54oGSxLYWHIF0wCU1k8HQ675lx1U3SZBIZBh4YioHEuFeUzhegvrjYqfPmyIpLsADIZCTAuxaII9be03XemuMlTlcOO1dsTMZD';
// const pageId = '136968512827904';
// const message = 'TEST NODE JS';
// const baseAttachmentUrl = 'https://thumbs.dreamstime.com/b/michael-jordan-chicago-bulls-legend-taking-free-throw-image-taken-color-slide-73861834.jpg';

// let isPostScheduled = false;

// async function postToFacebook() {
//   try {
//     // Append timestamp to the attachment URL to ensure uniqueness
//     const timestamp = new Date().getTime();
//     const attachmentUrl = `${baseAttachmentUrl}?timestamp=${timestamp}`;

//     // Post with the attachment and message
//     const postResponse = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
//       url: attachmentUrl,
//       caption: message,  // Using 'caption' for the message
//       access_token: accessToken,
//     });

//     console.log('Post successful:', postResponse.data);
//   } catch (error) {
//     console.error('Error posting to Facebook:', error.response ? error.response.data : error.message);
//   } finally {
//     isPostScheduled = false;
//   }
// }

// // Schedule the job to run every 2 minutes
// cron.schedule('*/1 * * * *', () => {
//   if (!isPostScheduled) {
//     postToFacebook();
//     isPostScheduled = true;
//   }
// });

// // Start the server
// app.listen(port, () => console.log(`Server is running on port ${port}`));

const cron = require('node-cron');
const bodyParser = require('body-parser');
const express = require('express');
const axios = require('axios');
const mysql = require('mysql');

const app = express();
const port = process.env.PORT || 3005;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const dbConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hoop_test',
});

const accessToken = 'EAAWiGqtpC2kBOw0wU80FtVynC3uLQF1zXZCbSK9kI51dtOXjGNhJK1kVpWueU0fArrxrmaWmOdMzbh5PnpSoeTZBatFa4PtvrDxuZBprqRLSMKqpvulYnLb6w54oGSxLYWHIF0wCU1k8HQ675lx1U3SZBIZBh4YioHEuFeUzhegvrjYqfPmyIpLsADIZCTAuxaII9be03XemuMlTlcOO1dsTMZD';
const pageId = '136968512827904';
const message = 'TEST NODE JS';

let isPostScheduled = false;

dbConnection.connect((connectionError) => {
  if (connectionError) {
    console.error('Error connecting to database:', connectionError);
    return;
  }

  // Schedule the job to run every 2 minutes
  cron.schedule('*/1 * * * *', () => {
    if (!isPostScheduled) {
      postToFacebook();
      isPostScheduled = true;
    }
  });

  // Start the server
  app.listen(port, () => console.log(`Server is running on port ${port}`));
});

function postToFacebook() {
    try {
      // Select all image URLs from the images table
      const selectQuery = 'SELECT id, filename, github_url FROM images WHERE upload_status = "uploaded"';
      dbConnection.query(selectQuery, (selectError, selectResults) => {
        if (selectError) {
          console.error('Error selecting image URLs:', selectError);
          isPostScheduled = false;
          return;
        }
  
        if (selectResults.length > 0) {
          // Process each image record
          selectResults.forEach((imageRecord) => {
            const attachmentUrl = imageRecord.github_url;
            const imageId = imageRecord.id;
            const fileName = imageRecord.filename;
  
            // Check if the attachment URL is already present in the uploaded_image table
            const checkQuery = 'SELECT filename FROM uploaded_image WHERE filename = ?';
            dbConnection.query(checkQuery, [fileName], (checkError, checkResults) => {
              if (checkError) {
                console.error('Error checking if URL exists:', checkError);
                return;
              }
  
              if (checkResults.length === 0) {
                // URL doesn't exist in uploaded_image table, insert it
                const insertQuery = 'INSERT INTO uploaded_image (filename, github_url) VALUES (?, ?)';
                dbConnection.query(insertQuery, [fileName, attachmentUrl], (insertError, insertResults) => {
                  if (insertError) {
                    console.error('Error inserting into uploaded_image table:', insertError);
                  } else {
                    console.log('Inserted into uploaded_image table with ID:', insertResults.insertId);
  
                    // Post with the attachment and message
                    axios.post(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
                      url: attachmentUrl,
                      caption: message,
                      access_token: accessToken,
                    })
                      .then((postResponse) => {
                        console.log('Post successful:', postResponse.data);
                      })
                      .catch((postError) => {
                        console.error('Error posting to Facebook:', postError.response ? postError.response.data : postError.message);
                      });
                  }
                });
              } else {
                console.log('URL already exists in uploaded_image table. Skipping post for', fileName);
              }
            });
          });
  
          isPostScheduled = false;  // Set the flag to false after processing all records
        } else {
          console.log('No image URLs found in the images table.');
          isPostScheduled = false;
        }
      });
    } catch (error) {
      console.error('Error:', error.message);
      isPostScheduled = false;
    }
  }
  
  
