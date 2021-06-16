const Mustache = require('mustache');
const DateTime = require('luxon').DateTime;
const { homepage, version } = require('./package.json');
const { s3enabled, s3endpoint, s3bucket } = require('./config.json');
const { formatBytes, randomHexColour } = require('./utils');

// https://ogp.me/
class OpenGraph {
	http;
	domain;
	resourceId;

	filename;
	type;
	size;
	timestamp;
	vibrant;

	title;
	description;
	author;
	color;

	constructor(http, domain, resourceId, { originalname, mimetype, size, timestamp, opengraph, vibrant }) {
		this.http = http;
		this.domain = domain;
		this.resourceId = resourceId;

		this.type = mimetype;
		this.filename = originalname;
		this.size = size;
		this.timestamp = timestamp;
		this.vibrant = vibrant;

		this.title = opengraph.title || '';
		this.description = opengraph.description || '';
		this.author = opengraph.author || '';
		this.color = opengraph.color || '';
	}

	build() {
		let resourceUrl = !s3enabled ? (this.http + this.domain + "/" + this.resourceId + (this.type.includes('video') ? '.mp4' : this.type.includes('gif') ? '.gif' : '')) : `https://${s3bucket}.${s3endpoint}/${this.filename}`;
		return Mustache.render(html, {
			homepage,
			version,

			http: this.http,
			domain: this.domain,
			resourceId: this.resourceId,
			resourceUrl,

			ogtype: this.type.includes('video') ? 'video.other' : 'image',
			type: this.type.includes('video') ? 'video' : 'image',
			title: (this.title.length != 0) ? `<meta property="og:title" content="${this.title}">` : '',
			description: (this.description.length != 0) ? `<meta property="og:description" content="${this.description}">` : '',
			site: (this.author.length != 0) ? `<meta property="og:site_name" content="${this.author}">` : '',
			color: (this.color.length != 0) ? `<meta name="theme-color" content="${this.getBuildColor()}">` : '',
			card: !this.type.includes('video') ? `<meta name="twitter:card" content="summary_large_image">` : '',
		})
			.replace(new RegExp('&size', 'g'), formatBytes(this.size))
			.replace(new RegExp('&filename', 'g'), this.filename)
			.replace(new RegExp('&timestamp', 'g'), DateTime.fromMillis(this.timestamp).toLocaleString(DateTime.DATETIME_MED));
	}

	getBuildColor() {
		return this.color === '&random' ? randomHexColour() : this.color === '&vibrant' ? this.vibrant : this.color;
	}
}

const html = `
<html>
  <head>
    <title>ass</title>
	<!-- Open Graph (https://ogp.me/) -->
    <meta property="og:type" content="{{{ogtype}}}">
    <meta property="og:{{{type}}}" content="{{{resourceUrl}}}">
    {{{title}}}
    {{{description}}}
    {{{site}}}
    {{{color}}}
    {{{card}}}
	<!-- oEmbed (https://oembed.com/) -->
	<link rel="alternate" type="application/json+oembed" href="{{{http}}}{{{domain}}}/{{{resourceId}}}/oembed.json" title="oEmbed">
  </head>
  <body>
    Open Graph response for <a href="{{{homepage}}}" target="_blank">ass</a> {{{version}}}
  </body>
</html>
`;

module.exports = OpenGraph;
