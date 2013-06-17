////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
//
// filePath / URI issues between MAC and PC
//http://summitprojectsflashblog.wordpress.com/2009/03/19/jsfl-for-converting-uris-to-platform-paths-and-back/
//
////////////////////////////////////////////////////////////////////////////////////////////////


// CSV parsing function
String.prototype.splitCSV = function(sep) {
	for (var foo = this.split(sep = sep || ";"), x = foo.length - 1, tl; x >= 0; x--) {
		if (foo[x].replace(/"\s+$/, '"').charAt(foo[x].length - 1) == '"') {
			if ((tl = foo[x].replace(/^\s+"/, '"')).length > 1 && tl.charAt(0) == '"') {
				foo[x] = foo[x].replace(/^\s*"|"\s*$/g, '').replace(/""/g, '"');
			} else if (x) {
				foo.splice(x - 1, 2, [foo[x - 1], foo[x]].join(sep));
			} else foo = foo.shift().split(sep).concat(foo);
		} else foo[x].replace(/""/g, '"');
	} return foo;
};

//This clears the output panel and prepares the active document for the script to continue.
var doc = fl.getDocumentDOM();
fl.outputPanel.clear();

var fileName = doc.name;
var filePath = platformPathToURI(doc.path);
filePath = filePath.substring(0, filePath.lastIndexOf(fileName));
fl.trace("Flash file: " + filePath + fileName);

if (fl.getDocumentDOM() == null) {
	fl.trace("Error: No document open.");
	alert("Error: No document open.");
}

var CSVfile = fileName.substr(0, fileName.length - 4) + ".csv";
var CSVTextFile = fileName.substr(0, fileName.length - 4) + "_text.csv";

fl.trace("  CSV file: " + filePath + CSVfile);
fl.trace("\n");
fl.trace(" Text file: " + filePath + CSVTextFile);
fl.trace("\n");

var list = FLfile.read(filePath + CSVfile);
var parsed = list.splitCSV();
var n = parsed.length - 1;

var textList = FLfile.read(unescape(filePath + CSVTextFile));
textList = textList.replace(/[\n\r]/g, "");
var textParsed = textList.splitCSV();
var t = textParsed.length - 1;
    
//This loop goes through the split CSV values backwards and reads every third item as an image and every first and second item as the x and y coordinates.
//The data is used to import and place each item on the stage with the corresponding image from the /<filename>_png/ folder that Photoshop created.

while (n > 0) {
	
	if (isMac()) {
		importFileToStage(filePath + parsed[n-2], parsed[n-2], parsed[n-1], parsed[n]);
	} else {
		importFileToStage(filePath + "/" + parsed[n-2], parsed[n-2], parsed[n-1], parsed[n]);
	}
   
	//This line displays output from the import process so that you can check x/y coordinates with what appears on the stage.
	fl.trace(parsed[n-2] + " placed at " + parsed[n-1] + "," + parsed[n]);
	n = n - 3;
}

//name;contents;leftPos;topPos;rightPos;bottomPos;caps;align;font;color;size;
while (t > 0) {
	var name = textParsed[t-10];				//Name of the layer
	var contents = textParsed[t-9];				//Contents of the text field
	var leftPos = Number(textParsed[t-8]);		//Left pixel position
	var topPos = Number(textParsed[t-7]);		//Top pixel position
	var rightPos = Number(textParsed[t-6]);		//Right pixel position
	var bottomPos = Number(textParsed[t-5]);	//Bottom pixel position
	var caps = textParsed[t-4];					//Capitalization method
	var font = textParsed[t-3];					//Font name
	var color = textParsed[t-2];				//Color value in hex
	var size = Number(textParsed[t-1]);			//Size
	var align = textParsed[t];					//Alignment
	align = align.replace("Justification.","").toLowerCase();
	
	switch(align) {
		case "center":
			topPos = topPos - Math.floor(size * 0.29);
			leftPos = leftPos - Math.floor(size * 0.06);
			rightPos += 4;
			break;
		case "left":
			topPos = topPos - Math.floor(size * 0.29);
			leftPos = leftPos - Math.floor(size * 0.08);
			rightPos += 4;
			break;
		case "right":
			topPos = topPos - Math.floor(size * 0.29);
			leftPos = leftPos - Math.floor(size * 0.1);
			leftPos -= 4;
			rightPos += 6;
			break;
		default:
			topPos = topPos - Math.floor(size * 0.29);
			leftPos = leftPos - Math.floor(size * 0.06);
			rightPos += 4;
	}

	fl.trace(name + ", " + contents + ", " + leftPos + ", " + topPos + ", " + rightPos + ", " + bottomPos + ", " + caps + ", " + font + ", " + color + ", " + size + ", " + align);
	doc.addNewText({left:leftPos, top:topPos, right:rightPos, bottom:bottomPos});
	doc.setTextString(contents);
	doc.selection[0].textType = "dynamic";
	doc.selection[0].setTextAttr("face", font);
	doc.selection[0].setTextAttr("fillColor", "#" + color);
	doc.selection[0].setTextAttr("size", size);
	doc.selection[0].setTextAttr("alignment", align);

	t = t - 11;
}

fl.selectTool("arrow");
doc.selectAll();
//doc.distributeToLayers();
doc.selectNone();

// This function imports a given file at a given path to the stage and then places it at the included X and Y values.
function importFileToStage(filePath,fileName,importX,importY) {
	//Convert importX and importY to numbers
	var itemIndex, theItem, instanceName;
	var stageX = Number(importX);
	var stageY = Number(importY);

	//Import the file
	if (doc.library.findItemIndex(fileName) == "") {
		fl.trace(filePath + " " + fileName);
		doc.importFile(filePath, true);
		itemIndex = doc.library.findItemIndex(fileName);
		theItem = doc.library.items[itemIndex];

		//Add item to the stage
		doc.addItem({x:0,y:0}, theItem);
		doc.selection[0].x = stageX;
		doc.selection[0].y = stageY;
		//Make the item a button or movie clip
		createFlashAsset(theItem);
	} else {
		instanceName = fileName.substr(0, fileName.length - 4);
		//suffix = instanceName.slice(instanceName.length - 2, instanceName.length);
		itemIndex = doc.library.findItemIndex(instanceName);
		theItem = doc.library.items[itemIndex];
		doc.addItem({x:0,y:0}, theItem);
		doc.selection[0].x = stageX;
		doc.selection[0].y = stageY;
	}
}

// Create a movie clip or button based on the naming of the object
function createFlashAsset(item) {
	var assetType;
	mcName = item.name;
	mcName = mcName.substr(0, mcName.lastIndexOf('.'));
	var prefix = mcName.slice(0, 3);
	//var suffix = mcName.slice(mcName.length - 2, mcName.length);
	
	if (prefix == "btn") {
		assetType = "button";
	} else {
		assetType = "movie clip";
	}
	
	if (mcName != null)	{
		newMc = doc.convertToSymbol(assetType, mcName, "top left");

		var lib = doc.library;
		if (lib.getItemProperty('linkageImportForRS') == true) {
			lib.setItemProperty('linkageImportForRS', false);
		}
		lib.setItemProperty('linkageExportForAS', true);
		lib.setItemProperty('linkageExportForRS', false);
		lib.setItemProperty('linkageExportInFirstFrame', true);
		lib.setItemProperty('linkageClassName', mcName);
         lib.setItemProperty('linkageBaseClass', 'flash.display.Sprite');
		lib.setItemProperty('scalingGrid',  false);
	}
}

/**
 * Converts a filename in a platform-specific format to a file:/// URI.
 * @param	path	A string, expressed in a platform-specific format, specifying the filename you want to convert.
 * @return			A string expressed as a file:/// URI.
**/
function platformPathToURI(path) {
	if (isCS4()) {
		return FLfile.platformPathToURI(path);
	} else {
		if (isMac()) {
			path = path.replace(/ /g, "%20");
			path = "file:///" + path;
		} else {
			path = path.replace(/:\\/, "|/");
			path = path.replace(/\\/, "/");
			path = escape(path);
			path = "file:///" + path;
		}
		return path;
	}
}


/**
 * Converts a filename expressed as a file:/// URI to a platform-specific format.
 * @param	uri		A string, expressed as a file:/// URI, specifying the filename you want to convert.
 * @return			A string representing a platform-specific path.
**/
function uriToPlatformPath(uri) {
	if (isCS4()) {
		return FLfile.uriToPlatformPath(uri);
	} else {
		if (isMac()) {
			uri = uri.replace("file:///", "");
			uri = uri.replace("%20", " ");
		} else {
			uri = unescape(uri);
			uri = uri.replace(/file:\/\/\/([A-Z])|/, "$1:");
			uri = uri.replace("file:///", "");
			uri = uri.replace(/\//g, "\\");
		}
		return uri;
	}
}


/**
 * Determines if the script is running on a Mac or not.
 * @return	A Boolean value of true if running on a Mac; false otherwise.
**/
function isMac() {
	return (fl.version.search(/mac/i) > -1);
}


/**
 * Determines if the script is running in Flash CS4 or higher, or not.
 * @return	A Boolean value of true if running CS4 or higher; false if running CS3 or lower.
**/
function isCS4() {
	var versionRE = /(\w+)\s+(\d+)(,\d+)+/;
	var matches = versionRE.exec(fl.version);
	var majorVersion = parseInt(matches[2]);
	if (majorVersion >= 10) {
		return true;
	}
	return false;
}