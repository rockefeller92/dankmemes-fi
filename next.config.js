// next.config.js
const withPlugins = require('next-compose-plugins');
const optimizedImages = require('next-optimized-images');

// all the dynamic pages need to be defined here (this needs to be imported from the routes)
module.exports = withPlugins([[optimizedImages]], {
	trailingSlash: !!process.env.NEXT_PUBLIC_TRAILING_SLASH_ENABLED,
	exportPathMap: function (defaultPathMap) {
		return {
			...defaultPathMap
		};
	},
});
