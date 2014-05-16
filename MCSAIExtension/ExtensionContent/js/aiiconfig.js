// TITLE USED TO DISPLAY THE TITLE OF THE WEBSITE
var ApplicationTitle = "ArcGIS Extension for Adobe Illustrator";

// IMAGE ICON USED TO DISPLAY A LOGO ON THE TITLE AREA ON THE WEBSITE
var LogoImage = "images/esri-logo.png";
var LogoWidth = 102;
var LogoHeight= 39;

// TAB HEADERS USED TO LABEL THE PRODUCT AND EXPORT TABS
var Headers = {
	layers: "Feature Services",
	SearchDataPlaceholder: "search service...",
	runService: "Add selected features",
	download: "Download Map",
	download_description: "Download Map"
};

// ALLBASEMAPS Displayed in CHANGE LAYERS LIST
var DefaultBasemapLayer = "Light Gray Canvas";
var AllBasemaps = [
	{ displayName:"Topographic", url:"http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer" },
	{ displayName:"Imagery", url:"http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer" },
	{ displayName:"Imagery with Labels", url:"http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer,http://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer" },
	{ displayName:"Streets", url:"http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer" },
	{ displayName:"Terrain with Labels", url:"http://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer,http://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer" },
	{ displayName:"Light Gray Canvas", url:"http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer,http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer" },
	{ displayName:"National Geographic", url:"http://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer" },
	{ displayName:"Oceans", url:"http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer" }
];

// CALCULATE AREA GP SERVICE USED BY THE ADD / MOVE EXTENT BUTTONS ON TOOLBAR
var GPServiceAreaUrl = "http://pod-web-srv-1/arcgis/rest/services/TerraNova/CalculateExtent/GPServer/CalculateExtent";
var ProductImagePreviewServiceUrl = "http://pod-web-srv-1/arcgis/rest/services/TerraNova/TerraNova_Tools/GPServer/GeneratePreview";
// If changed, sync with <serverUrl> tag content in the ..\proxy\proxy.config file
var GatewayScriptURL = "http://pod-web-srv-1/arcgis/rest/services/TerraNova/TerraNova_Tools/GPServer/POD%20Gateway";
//var GPGeometryServiceUrl = "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer";
var MapOutputLocation = "http://pod-web-srv-1.esri.com/MCS_POD/arcgisoutput";

//############################################
//PRODUCT TYPE AND PRODUCT DEFINITION SETTINGS
//############################################

