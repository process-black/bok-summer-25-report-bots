const { llog } = require('../ll-utilities');
const axios = require('axios');
const { google } = require('googleapis');

const getSheetData = async function (options) {
    llog.magenta("get sheet data with options:", options)

    const keys = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    llog.blue(keys)
    
    const sheetId = options.sheetId;

    const auth = await google.auth.getClient({
      projectId: keys.project_id,
      credentials: {
        type: "service_account",
        private_key: keys.private_key,
        client_email: keys.client_email,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  
    const sheets = google.sheets({ version: "v4", auth });
  
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${options.sheetName}!A2:N`, // Adjust the range as needed
    });

    llog.green("response.data.values:", response.data.values);
    return(response.data.values);
}

module.exports.getSheetData = getSheetData;
