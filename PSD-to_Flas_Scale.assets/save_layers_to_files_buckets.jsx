////////////////////////////////////////////////////////////////////////////////////////////////
//
//Script made by Rory Starks & Chris West
//
#target photoshop

app.preferences.ruleUnits = Units.PIXELS;

try {
	//
	var win = new Window("dialog","Choose Asset Type to Export");
	var panelScale = win.add("panel", undefined, "");
	var ddl = panelScale.add("dropdownlist");
	
    ddl.add('item','100% Output assets at current scale');
    ddl.add('item','50% Output assets at 0.5 scale');
	
    ddl.selection = 0;
    
	var btnOk = win.add("button", undefined, "Ok");
	
	win.alignChildren = panelScale.alignChildren = "fill";
	panelScale.spacing = 3;

	panelScale.orientation = "row";
	//win.helpTip = "Coded by";
	
	btnOk.onClick = function(){
	  main();
    }
	
    win.center();
    win.show();
}
catch (exception) {
	// Show degbug message and then quit
	alert(exception);
}
    
function main(){

    win.close();
    
	if(!documents.length) return;
	
	//preference variables
	trim = true;
    resize = true;
	writeCSVs = true;
	writeXML = true;
	writeTextStyles = true;
    
	var sizes = {
        '0':100,
		'1':50
	}

    var bucketNames = {
        '0':'100percent',
		'1':'50percent'
	}

    var bucketFontUpScale = {
        '0':'4',
		'1':'4'
	}

    selectedSize = sizes[parseInt(ddl.selection.index)];
    selectedBucket = bucketNames[parseInt(ddl.selection.index)];
    modifier = sizes[parseInt(ddl.selection.index)]/100;
    fontModifier = bucketFontUpScale[parseInt(ddl.selection.index)];


	var doc = activeDocument;
	var oldPath = activeDocument.path;

	//prepare text strings that will be used for the output files
	var CSVGraphics = "";
	var CSVText = "";
	var XMLText  = '<layout sourcefile="' + doc.name + '">\n';
	var textStyles = "Text Style information for " + doc.name + "\n==========================================================================\n\n";
    
    //creates the output folder for the exported images
	var outFolder = new Folder(oldPath + "/" + doc.name.substr(0, doc.name.length - 4) + "_" + selectedBucket);
	if (!outFolder.exists) { outFolder.create(); }
	
	//prepare output files
	var CSVGraphicsOutput = File(outFolder + "/" + doc.name.substr(0, doc.name.length - 4) + "_" + selectedBucket+ ".csv");
	var CSVTextOutput = File(outFolder + "/" + doc.name.substr(0, doc.name.length - 4) + "_" + selectedBucket+ "_text.csv");
	var XMLOutput = File(outFolder + "/" + doc.name.substr(0, doc.name.length - 4) + "_" + selectedBucket+ ".xml");
	var textOutput = File(outFolder + "/" + doc.name.substr(0, doc.name.length - 4) + "_" + selectedBucket+ "_text_styles.txt");

	//runs the two main functions of the script
	scanLayerSets(doc);
	scanTextLayers(doc.layers);
 
 	//scans the document looking for layers with .png, .jpg, or .jpeg at the end of the name
	function scanLayerSets(el) {
    	// find layer groups
    	for(var a=0;a<el.layerSets.length;a++){
			var lname = el.layerSets[a].name;
        	if (lname.substr(-4) == ".png" || lname.substr(-4) == ".jpg" || lname.substr(-4) == ".jpeg" ) { //&& el.layerSets[a].visible == true
				saveLayer(el.layers.getByName(lname), lname, oldPath, true,resize);
				if (writeCSVs || writeXML) writeGraphicsLayer(el.layers.getByName(lname), lname);
        	} else {
            	// recursive
            	scanLayerSets(el.layerSets[a]);
			}
		}
    
 		// find plain layers in current group whose names end with .png
    	for(var j=0; j<el.artLayers.length; j++) {
    		var name = el.artLayers[j].name;
    		if (name.substr(-4) == ".png" || name.substr(-4) == ".jpg" || name.substr(-5) == ".jpeg") {
				saveLayer(el.layers.getByName(name), name, oldPath, true,resize);
				if (writeCSVs || writeXML) writeGraphicsLayer(el.layers.getByName(name), name);
			}
		}
	}

	//saves the layer as a JPG or PNG based on the extension of the layer name
	function saveLayer(layer, lname, path, shouldMerge, shouldResize) {
		activeDocument.activeLayer = layer;
		dupLayers();
		if (shouldMerge === undefined || shouldMerge === true) {
              activeDocument.artLayers.add();
			activeDocument.mergeVisibleLayers();
		}
		
		//trims the canvas
		if (trim) {
			activeDocument.trim(TrimType.TRANSPARENT,true,true,true,true);
		}
		
		//resizes the image based on the selected size percentage
		if (shouldResize) {

			sizeX = activeDocument.width.value;
			sizeY = activeDocument.height.value;

			resizeX = Math.floor(sizeX * modifier);
			resizeY = Math.floor(sizeY * modifier);

			activeDocument.resizeImage(resizeX, resizeY, null, ResampleMethod.BICUBIC);
		}
		
		var saveFile = File(oldPath + "/" + doc.name.substr(0, doc.name.length - 4) + "_" + selectedBucket + "/" + lname);
		
		if (lname.substr(-4) == ".png") {
			SavePNG(saveFile);
		} else if (lname.substr(-4) == ".jpg" || lname.substr(-5) == ".jpeg") {
			SaveJPEG(saveFile);
		}			
		app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
	}
	
	//creates coordinate CSVs that can be read by the Flash script
	function writeGraphicsLayer(layer, lname) {
		
		xPos = Math.floor(layer.bounds[0] * modifier); 
		yPos = Math.floor(layer.bounds[1] * modifier);
		yPosLB = Math.floor(((layer.bounds[3] * -1) + activeDocument.height.value) * modifier);
		width = Math.floor((layer.bounds[2] - layer.bounds[0]) * modifier);
		height = Math.floor((layer.bounds[3] - layer.bounds[1]) * modifier);
		
		//write coordinate CSV file
		if (writeCSVs) {
			
	  		if (CSVGraphics == "") {
				CSVGraphics += lname.replace(/\s/g , "-");
			} else {
				CSVGraphics += ";" + lname.replace(/\s/g , "-");
			}
			
			CSVGraphics += ";" + xPos;
			CSVGraphics += ";" + yPos;
		}
		//write XML file
		if (writeXML) {
			XMLText += '   <img filename="' + lname.replace(/\s/g , "-") + '" x="' + xPos + '" y="' + yPosLB + '" width="' + width + '" height="' + height + '" />\n';
		}
	}
	
	//scans all text layers and then writes text style info or CSV data depending on the user preferences
	function scanTextLayers(layers) {
		for(var t=0;t<layers.length;t++){
			if(layers[t].typename == "LayerSet" && layers[t].visible == true) {
				scanTextLayers(layers[t].layers);
			} else {
				if(layers[t].kind == LayerKind.TEXT && layers[t].visible == true) {
					if (writeTextStyles) writeTextLayer(layers[t]);
					if (writeCSVs) writeTextCSV(layers[t]);
				}
			}
		}
	}
	
	//writes the given text layer info to the textStyles variable which will eventually be added to the text style TXT file
	function writeTextLayer(layer) {
        
		var name = layer.name;
         
         if(layer.textItem.contents == null) return;
        
         try { 
             
             var contents = layer.textItem.contents;

            var leftPos = Math.floor(layer.bounds[0] * modifier);
            var topPos = Math.floor(layer.bounds[1] * modifier);
            var rightPos = Math.floor(layer.bounds[2] * modifier);
            var bottomPos = Math.floor(layer.bounds[3] * modifier);
            //var caps = layer.textItem.capitalization=="TextCase.NORMAL"?"normal":"uppercase";
            var caps = "normal";
            var font = layer.textItem.font;
            
            var color = layer.textItem.color.rgb.hexValue?layer.textItem.color.rgb.hexValue:'';

            var calculateFontSize = Math.round((layer.textItem.size * modifier) * fontModifier);
            if(calculateFontSize < 10) { calculateFontSize = 10; }
            var size = calculateFontSize;
            
            var align = layer.textItem.justification.toString();

            textStyles += "---------------------------------------------calculateFontSize-----------------------------\n";
            textStyles += "Layer Name:                " + name + "\n";
            textStyles += "Content:                   " + contents.replace(/\r/gm,' ') + "\n";
            textStyles += "Location (left,top):       " + leftPos + "," + topPos + "\n";
            textStyles += "Location (right,bottom):   " + rightPos + "," + bottomPos + "\n";
            textStyles += "Capitalization Style:      " + caps + "\n";
            textStyles += "Font Name:                 " + font + "\n";
            textStyles += "Color (hex value):         #" + color + "\n";
            textStyles += "Font Size:                 " + size + "px \n";
            textStyles += "Alignment:                 " + align.replace("Justification.","").toLowerCase() + "\n";
            textStyles += "\n\n";
		
         } 
         catch (e) {
             alert("Error with text field properties for : - " + contents + " - ");
         } 
	}
	
	//writes a list of information that can be read by the Flash import script
	function writeTextCSV(layer) {
        
        var name = layer.name;
        var contents = layer.textItem.contents;
	
		var leftPos = Math.floor(layer.bounds[0] * modifier); 
		var topPos = Math.floor(layer.bounds[1] * modifier);
		var rightPos = Math.floor(layer.bounds[2] * modifier);
		var bottomPos = Math.floor(layer.bounds[3] * modifier);
		//var caps = layer.textItem.capitalization=="TextCase.NORMAL"?"normal":"uppercase";
		var caps = "normal";
		var font = layer.textItem.font;
		var color = layer.textItem.color.rgb.hexValue?layer.textItem.color.rgb.hexValue:'';
		
        var calculateFontSize = Math.round((layer.textItem.size * modifier) * fontModifier);
        if(calculateFontSize < 10) { calculateFontSize = 10; }
        var size = calculateFontSize;
        
		var align = layer.textItem.justification;
	 		
 		if (CSVText == "") {
			CSVText += name;
		} else {
			CSVText += ";" + name;
		}
			
		CSVText += ";" + contents;
		CSVText += ";" + leftPos;
		CSVText += ";" + topPos;
		CSVText += ";" + rightPos;
		CSVText += ";" + bottomPos;
		CSVText += ";" + caps;
		CSVText += ";" + font;
		CSVText += ";" + color;
		CSVText += ";" + size;
		CSVText += ";" + align;
	}

	//the following if statements finish up and save out any of the requested data files
	if (writeCSVs) {
		CSVGraphicsOutput.open("w");
		CSVGraphicsOutput.writeln(CSVGraphics);
		CSVGraphicsOutput.close();
		
		CSVTextOutput.open("w");
		CSVTextOutput.writeln(CSVText);
		CSVTextOutput.close();
	}
	
	if (writeXML) {
		XMLText  += "<\layout>";
		XMLOutput.open("w");
		XMLOutput.writeln(XMLText);
		XMLOutput.close();
	}
	
	if (writeTextStyles) {
		textStyles += "==========================================================================\n";
		textOutput.open("w");
		textOutput.writeln(textStyles);
		textOutput.close();
	}
	
	alert("Saving layers to files was successful.");
};

function dupLayers() {
	var desc143 = new ActionDescriptor();
	var ref73 = new ActionReference();
	ref73.putClass( charIDToTypeID('Dcmn') );
	desc143.putReference( charIDToTypeID('null'), ref73 );
	desc143.putString( charIDToTypeID('Nm  '), activeDocument.activeLayer.name );
	var ref74 = new ActionReference();
	ref74.putEnumerated( charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );
	desc143.putReference( charIDToTypeID('Usng'), ref74 );
	executeAction( charIDToTypeID('Mk  '), desc143, DialogModes.NO );
};

//export script for PNG files
function SavePNG(saveFile){
	var pngOpts = new ExportOptionsSaveForWeb; 
	pngOpts.format = SaveDocumentType.PNG;
	pngOpts.PNG8 = false; 
	pngOpts.transparency = true; 
	pngOpts.interlaced = false; 
	pngOpts.quality = 100;
	activeDocument.exportDocument(new File(saveFile),ExportType.SAVEFORWEB,pngOpts);
}

//export script for JPEG files
function SaveJPEG(saveFile){
	var jpegOpts = new ExportOptionsSaveForWeb; 
	jpegOpts.format = SaveDocumentType.JPEG;
	jpegOpts.optimized = true;
	activeDocument.exportDocument(new File(saveFile),ExportType.SAVEFORWEB,jpegOpts, Extension.LOWERCASE);
}