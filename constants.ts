
export const EMAIL_SIGNATURE = `Best regards,

Chris W.
Waste Experts
chrisw@wasteexperts.com
www.wasteexperts.com`;

export const BID_TEMPLATE_CURRENT = `Good Morning,

Please see attached form.

We are seeking pricing to retain customer {accountInfo}

Please provide your best pricing. The customer is seeking a 36-month service agreement, with no auto-renewal, rate firm first year and CPI cap of 5% on year 2 & 3. 30 day out.

Thank you,
{signature}`;

export const BID_TEMPLATE_NEW = `Hi {haulerName},

Please see attached form.

We are seeking pricing for a customer located on {address}. If the area referenced is within your service area, please provide your best (all in) pricing. The customer is seeking a 36-month service agreement, with no auto-renewal, rate firm first year and CPI cap of 5% on year 2 & 3. 30 day out.

{signature}`;

export const TEMPLATE_MISSED_PICKUP = `Hi {haulerName},

We are reporting a missed pickup for the following location:
Address: {address}
Account: {accountInfo}

Please let us know when the recovery is scheduled.

{signature}`;

export const TEMPLATE_RFQ_COMPACTOR = `Hi {haulerName},

We are seeking a quote for a compactor installation at:
Location: {address}
Client Ref: {clientRef}

Please provide equipment specs and monthly rental/haul rates.

{signature}`;

export const TEMPLATE_BILLING_INQUIRY = `Hi {haulerName},

We have a question regarding the recent invoice for:
Account: {accountInfo}
Location: {address}

Please review and provide clarification.

{signature}`;

/**
 * Registry of known brokers and haulers extracted from the provided PDF document.
 */
export const MOCK_BROKERS: any[] = [
  // General Haulers
  { haulerName: 'Melissa Falk (WG Waste)', brokerEmail: 'MelissaF@wgwaste.com', notes: 'GA Atlanta Specific', states: ['GA'] },
  { haulerName: 'Northeast Recycling LLC', brokerEmail: 'johnmcdonough70@gmail.com', notes: 'MA Boston Specific', states: ['MA'] },
  { haulerName: 'Bigs Sanitation', brokerEmail: 'rlowman@bigssanitation.com', notes: 'PA Vernon Specific - Great Rates', states: ['PA'] },
  { haulerName: 'Southern Sanitation', brokerEmail: 'service@southernsan.net', notes: 'Service Area: VA / CA', states: ['VA', 'CA'] },
  { haulerName: 'Waste Pro (Mandy Krieger)', brokerEmail: 'mkrieger@wasteprousa.com', notes: 'FL Orlando Specific', states: ['FL'] },
  { haulerName: 'Waste Pro (General)', brokerEmail: 'wpna@wasteprousa.com', notes: 'All Areas' },
  { haulerName: 'Waste Connections (David Graves)', brokerEmail: 'David.Graves@wasteconnections.com', notes: 'NC/SC Charleston, North Charleston', states: ['NC', 'SC'] },
  { haulerName: 'Waste Connections (Brandi Allen)', brokerEmail: 'brandi.allen@wasteconnections.com', notes: 'SC Greenville Specific', states: ['SC'] },
  { haulerName: 'Waste Connections (Jade Cooper)', brokerEmail: 'jade.cooper@wasteconnections.com', notes: 'LA Area', states: ['LA'] },
  { haulerName: 'Waste Solutions (Heath Sadler)', brokerEmail: 'wastesolutions@markdunning.com', notes: 'FL Northeast, AL Southeast, GA Southwest', states: ['FL', 'AL', 'GA'] },
  { haulerName: 'Frontier Waste (Martin Rosen)', brokerEmail: 'mrosen@frontierwaste.com', notes: 'TX Irving Area', states: ['TX'] },
  { haulerName: 'Coastal Waste & Recycling', brokerEmail: 'jalbritton@coastalwasteinc.com', notes: 'Broker Contact' },
  { haulerName: 'Meridian Waste (Francesa Weir)', brokerEmail: 'fwier@meridianwaste.com', notes: 'FL Broker Contact', states: ['FL'] },
  { haulerName: 'Active Waste Solutions', brokerEmail: 'lmattingly@activewastesolutions.com', notes: 'NC/SC Areas', states: ['NC', 'SC'] },
  { haulerName: 'JJ\'s Waste and Recycling', brokerEmail: 'yenny.spainhower@jjswaste.com', notes: 'FL Area', states: ['FL'] },
  { haulerName: 'Recology (Western)', brokerEmail: 'info@recology.com', notes: 'WA, OR, CA Regional', states: ['WA', 'OR', 'CA'] },
  { haulerName: 'Rumpke Waste & Recycling', brokerEmail: 'broker.desk@rumpke.com', notes: 'OH, KY, IN, WV', states: ['OH', 'KY', 'IN', 'WV'] },
  { haulerName: 'Kimble Recycling', brokerEmail: 'sales@kimble-recycling.com', notes: 'OH Regional', states: ['OH'] },
  { haulerName: 'Burrtec Waste Industries', brokerEmail: 'brokers@burrtec.com', notes: 'CA Inland Empire', states: ['CA'] },
  { haulerName: 'Athens Services', brokerEmail: 'info@athensservices.com', notes: 'CA Los Angeles Area', states: ['CA'] },
  { haulerName: 'Texas Disposal Systems', brokerEmail: 'brokers@texasdisposal.com', notes: 'TX Central/Austin', states: ['TX'] },
  { haulerName: 'Borden Waste-Away', brokerEmail: 'service@wasteawaygroup.com', notes: 'IN, MI Regional', states: ['IN', 'MI'] },
  { haulerName: 'Lakeshore Recycling (LRS)', brokerEmail: 'brokers@lrsrecycles.com', notes: 'IL, WI, MN', states: ['IL', 'WI', 'MN'] },
  { haulerName: 'Waste Management (Pacific)', brokerEmail: 'pnwbroker@wm.com', notes: 'WA, OR, ID, AK', states: ['WA', 'OR', 'ID', 'AK'] },
  { haulerName: 'Republic Services (West)', brokerEmail: 'westregionbrokers@republicservices.com', notes: 'AZ, NV, UT', states: ['AZ', 'NV', 'UT'] },
  { haulerName: 'Waste Connections (Mountain)', brokerEmail: 'mountainbrokers@wasteconnections.com', notes: 'CO, WY, MT', states: ['CO', 'WY', 'MT'] },
  
  // GFL Regions
  { haulerName: 'GFL Region 1', brokerEmail: 'gflnapricingusregion1@gfl.com', notes: 'AL, FL, GA', states: ['AL', 'FL', 'GA'] },
  { haulerName: 'GFL Region 2', brokerEmail: 'gflnapricingusregion2@gfl.com', notes: 'NC, SC, VA', states: ['NC', 'SC', 'VA'] },
  { haulerName: 'GFL Region 3', brokerEmail: 'gflnapricingusregion3@gfl.com', notes: 'TN, KY, AR, MO, KS, OK, TX', states: ['TN', 'KY', 'AR', 'MO', 'KS', 'OK', 'TX'] },
  { haulerName: 'GFL Region 4', brokerEmail: 'gflnapricingusregion4@gfl.com', notes: 'MI, IN', states: ['MI', 'IN'] },
  { haulerName: 'GFL Region 5', brokerEmail: 'gflnapricingusregion5@gfl.com', notes: 'WI, IL', states: ['WI', 'IL'] },
  { haulerName: 'GFL (Tiffany Ebron)', brokerEmail: 'tebron@gflenv.com', notes: 'Customer Service ALL' },
  { haulerName: 'GFL (Billing Change)', brokerEmail: 'mybilling@gflenv.com', notes: 'Billing Department' },
  { haulerName: 'GFL (Matthew Deveau)', brokerEmail: 'mdeveau@gflenv.com', notes: 'MI Area', states: ['MI'] },

  // Waste Management
  { haulerName: 'WM Heartland', brokerEmail: 'wmnaheartland@wm.com', notes: 'IL, NW, IN, MO, IA, NE, KS', states: ['IL', 'NW', 'IN', 'MO', 'IA', 'NE', 'KS'] },
  { haulerName: 'WM CommonWealth', brokerEmail: 'commonwealth@wm.com', notes: 'WPNA, WV, VA, MD, DC', states: ['WV', 'VA', 'MD', 'DC'] },
  { haulerName: 'WM East GMA', brokerEmail: 'wmbr-east-gma@wm.com', notes: 'NY, NJ, PA', states: ['NY', 'NJ', 'PA'] },
  { haulerName: 'WM WMBR Neny', brokerEmail: 'wmbr-neny@wm.com', notes: 'MA, RI, NH, ME, VT, NY', states: ['MA', 'RI', 'NH', 'ME', 'VT', 'NY'] },
  { haulerName: 'WM Miohin Broker', brokerEmail: 'miohinbroker@wm.com', notes: 'MI, OH, IN', states: ['MI', 'OH', 'IN'] },
  { haulerName: 'WM WIMN Broker Desk', brokerEmail: 'wimnbrokerdesk@wm.com', notes: 'WI, MN, SD, ND, IA, MI', states: ['WI', 'MN', 'SD', 'ND', 'IA', 'MI'] },
  { haulerName: 'WM Chris Rose', brokerEmail: 'crose@wm.com', notes: 'FL Area', states: ['FL'] },
  { haulerName: 'WM Texoma', brokerEmail: 'lmbtexoma@wm.com', notes: 'TX, OK (Javier)', states: ['TX', 'OK'] },
  { haulerName: 'WM Naw Ca Sac', brokerEmail: 'nawcasac@wm.com', notes: 'CA Sacramento Area', states: ['CA'] },

  // Republic Services
  { haulerName: 'Republic (Armani Miller)', brokerEmail: 'amiller2@republicservices.com', notes: 'ALL Areas' },
  { haulerName: 'Republic (Brendan Bell)', brokerEmail: 'bbell2@republicservices.com', notes: 'MO Kansas City', states: ['MO'] },
  { haulerName: 'Republic (Terry Moore)', brokerEmail: 'tmoore9@republicservices.com', notes: 'NC Area', states: ['NC'] },
  { haulerName: 'Republic (Jenna Kauth)', brokerEmail: 'jkauth2@republicservices.com', notes: 'FL Panhandle', states: ['FL'] },
  { haulerName: 'Republic (Stephen Mauro)', brokerEmail: 'SMauro@republicservices.com', notes: 'Denver, CO', states: ['CO'] },
  { haulerName: 'Republic (Chris Mehring)', brokerEmail: 'CMehring@republicservices.com', notes: 'Denver, CO', states: ['CO'] },
  { haulerName: 'Republic (Amanda Paschke)', brokerEmail: 'apaschke@republicservices.com', notes: 'VA Area', states: ['VA'] },

  // Specialized / Others
  { haulerName: 'Waste Caddy', brokerEmail: 'Samantha.Dolan@djproducts.com', notes: 'Really good product' },
  { haulerName: 'Common Waste (Orders)', brokerEmail: 'orders@commonwaste.com', notes: 'Regular Ordering' },
  { haulerName: 'Check Sammy (Heather Auer)', brokerEmail: 'heather@checksammy.com', notes: 'CS Invoicing - Billing' },
  { haulerName: 'Olympic Compactors', brokerEmail: 'anthony@olympiccompactor.com', notes: 'Compactor Ordering' }
];
