const axios = require('axios');
const parser = require('xml2js');

exports.handler = async function(event, context) {
  try {
    const response = await axios.get('https://www.ign.com/rss/articles/feed');
    const result = await parser.parseStringPromise(response.data);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result.rss.channel[0].item)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching news' })
    };
  }
};
