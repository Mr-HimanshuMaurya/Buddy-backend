export const visitEmailTemplate = (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9; }
          .header { background-color: #4F46E5; color: #fff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 20px; background-color: #fff; }
          .field { margin-bottom: 10px; }
          .label { font-weight: bold; color: #555; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Visit Scheduled!</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have a new visit scheduled for your property <strong>${data.propertyTitle}</strong>.</p>
            
            <div class="field">
              <span class="label">Visitor Name:</span> ${data.name}
            </div>
            <div class="field">
              <span class="label">Email:</span> ${data.email}
            </div>
            <div class="field">
              <span class="label">Phone:</span> ${data.phone}
            </div>
            <div class="field">
              <span class="label">Date:</span> ${data.date}
            </div>
            <div class="field">
              <span class="label">Time:</span> ${data.time}
            </div>
            ${data.message ? `
            <div class="field">
              <span class="label">Message:</span> ${data.message}
            </div>
            ` : ''}
            
            <p>Please contact the visitor to confirm the visit.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Buddy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  export const enquiryEmailTemplate = (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9; }
          .header { background-color: #10B981; color: #fff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 20px; background-color: #fff; }
          .field { margin-bottom: 10px; }
          .label { font-weight: bold; color: #555; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Property Enquiry!</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have received a new enquiry for your property <strong>${data.propertyTitle}</strong>.</p>
            
            <div class="field">
              <span class="label">Name:</span> ${data.name}
            </div>
            <div class="field">
              <span class="label">Email:</span> ${data.email}
            </div>
            <div class="field">
              <span class="label">Phone:</span> ${data.number}
            </div>
            <div class="field">
              <span class="label">City:</span> ${data.city}
            </div>
            <div class="field">
              <span class="label">Requirement:</span>
              <p>${data.message}</p>
            </div>
            
            <p>Please reach out to the potential tenant soon!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Buddy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
