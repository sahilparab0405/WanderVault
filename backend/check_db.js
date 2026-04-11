const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ email: String }, { strict: false }));
    
    // Find the latest user. Since we don't have createdAt indexed, we just find the last one by _id
    const user = await User.findOne().sort({ _id: -1 });
    
    let htmlContent = "<h2>MongoDB Collection Search Failed</h2>";
    if (user) {
      htmlContent = `
      <html><head><title>MongoDB Entry</title></head>
      <body style="font-family: monospace; background: #min; color: #333; padding: 20px;">
        <h2>MongoDB Atlas - Latest User Entry</h2>
        <div style="background: #eef; padding: 15px; border-radius: 8px;">
          <pre>${JSON.stringify(user.toObject(), null, 2)}</pre>
        </div>
      </body></html>
      `;
    }
    
    fs.writeFileSync('../db_screenshot.html', htmlContent);
    console.log("Wrote DB entry to db_screenshot.html");
  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}
check();
