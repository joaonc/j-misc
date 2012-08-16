// This script aligns two images side by side to a fixed width and variable height
// Keeps aspect ratio of both images
//
// By Joao Coelho, July 7, 2012
//
// Created and tested with Photoshop CS4
// probably runs with other versions as well, but not tested
//


// -------------------------------------------------------
// Parameters
// -------------------------------------------------------

var USE_OPEN_FILES = true  // whether to use files already open in Photoshop (true)
                            // or the files specified in the script (false)
var CLOSE_OPEN_FILES = true  // whether or not to close the files that are used during this script
                              // no changes are done to the originals
var REQUEST_FILENAME = false  // whether to request a filename or use default
var REQUEST_WIDTH = true  // whether to request width or use the one specified in this script

var W = 750 // final width in pixels, not used if REQUEST_WIDTH = true
var D = 6   // distance between images in pixels

// Files to open:  1: left file, 2: right file
// Not used if USE_OPEN_FILES = true
// NOTE: The ExtendScript File object expects Universal Resource Identifier (URI) notation. See the JavaScript Tools Guide for more information.
var fileNames = ["/C/Users/Public/Shared/Documents/Posts/1.jpg", "/C/Users/Public/Shared/Documents/Posts/2.jpg"]


// -------------------------------------------------------
// Script
// -------------------------------------------------------

var newFileName = REQUEST_FILENAME ? prompt("Filename (cancel for default)", "") : null
var createNewFileName = (newFileName == null || newFileName.length == 0)
if (createNewFileName) {
	newFileName = ""
}

if (REQUEST_WIDTH) {
	var newWidth = prompt("Enter width or cancel for " + W + "px.", "")
	if (newWidth != null && newWidth.length > 0) {
		// Check if integer
		if (/^\d*$/.test(newWidth)) {
			W = Number(newWidth.toString())
		} else {
			alert (newWidth + " is not a valid integer, using " + W + " px.")
		}
	}
}

// Remember current unit settings and then set units to the value expected by this script
var originalRulerUnits = preferences.rulerUnits
var originalTypeUnits = preferences.typeUnits
var originalDisplayDialogs = displayDialogs
preferences.rulerUnits = Units.PIXELS
preferences.typeUnits = TypeUnits.PIXELS
displayDialogs = DialogModes.NO

var w = []
var h = []
var fileDocs = []
// Open files and get dimensions
if (USE_OPEN_FILES) {
	if (documents.length != 2) {
		var err = new Error()
		err.name = "2x1 keep ratio"
		err.message = "There needs to be 2 documents open. Currently there are " + documents.length
		throw (err)
	}
	
	fileNames[0] = documents[0];
	fileNames[1] = documents[1];
}
for (var i=0; i<fileNames.length; i++) {
	if (USE_OPEN_FILES) {
		activeDocument = fileNames[i]
	} else {
		var file = File(fileNames[i])
		open(file)
	}
	fileDocs.push(activeDocument)
	w.push(activeDocument.width)
	h.push(activeDocument.height)
	
	if (createNewFileName) {
		// Regex at the end removes extension or does nothing if no extension
		newFileName = newFileName + (newFileName.length == 0 ? "" : "-") + fileDocs[i].name.replace(/\.[^\.]+$/, '')
	}
}

// Calculate final dimensions
var wFinal = []
wFinal.push(h[1]*w[0]*(W-D)/(h[0]*w[1]+h[1]*w[0]))
wFinal.push(W-D-wFinal[0])

var hFinal = wFinal[0]*h[0]/w[0]

// Create new document
var newDoc = documents.add(W, hFinal, 72, newFileName, NewDocumentMode.RGB, DocumentFill.TRANSPARENT, 1)
for (var i=0; i<fileDocs.length; i++) {
	// Flatten the document so we get everything and then copy
	activeDocument = fileDocs[i]
	fileDocs[i].flatten()
	fileDocs[i].selection.selectAll()
	fileDocs[i].selection.copy()

	// Paste to the new doc (in a new layer)
	activeDocument = newDoc
	newDoc.paste()
	newDoc.activeLayer.name = (i+1).toString() + "-" + fileDocs[i].name
	
	// Convert layer to smart object
	var idnewPlacedLayer = stringIDToTypeID("newPlacedLayer")
	executeAction(idnewPlacedLayer, undefined, DialogModes.NO);
   
	// Close file opened without saving any changes
	if (CLOSE_OPEN_FILES) {
		fileDocs[i].close(SaveOptions.DONOTSAVECHANGES)
	}
}

// Resize and move layers
var x = 0
activeDocument = newDoc
for (var i=0; i<newDoc.artLayers.length; i++) {
	// Last layer created has the lowest index
	var layer = newDoc.artLayers[newDoc.artLayers.length-i-1]
	newDoc.activeLayer = layer
	var bounds = layer.bounds
	
	layer.resize(wFinal[i]*100/(bounds[2]-bounds[0]), hFinal*100/(bounds[3]-bounds[1]), AnchorPosition.TOPLEFT)
	bounds = layer.bounds
	layer.translate(x-bounds[0], -bounds[1])
	x = x + bounds[2] + D
}

// Restore original unit settings
preferences.rulerUnits = originalRulerUnits
preferences.typeUnits = originalTypeUnits
displayDialogs = originalDisplayDialogs
