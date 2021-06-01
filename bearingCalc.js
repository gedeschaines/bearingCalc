// bearingCalc.js
//
// This is the JavaScript embedded within the bearingCalc.html file,
// simply externalized here to coerce GitHub into calculating a more
// accurate percentage of JavaScript represented in the bearingCalc
// code base.
//
// Carolina Bay to Saginaw Bay Impactor Bearing Calculator
//
// Derived from the defunct Bearing Calculator © 2010 Michael Davias,
// as referenced and documented here:
//
// http://cintos.org/SaginawManifold/BearingCalc/index.html
//
// Note: Changes made to JavaScript within the bearingCalc.html
//       file do not need to be made herein, unless this file
//       should be used as source for bearingCalc functionalality.
// 
// G. E. Deschaines

var flag_debug = false;
var text_debug = "";

function debugPrint (msg) {
    if ( flag_debug == false ) {
       return;
    };
    if ( text_debug == "" ) {
       text_debug = "DEBUG:<br>";
    };
    text_debug += arguments.callee.caller.name + ": " + msg + "<br>";
    document.getElementById('div-debug').innerHTML=text_debug;
};

// Bearing Calculator - global constants

VERS = "3.1";
VERS_DATE = "May 31, 2021"
KML_DOCSTRING = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
              + "<kml xmlns=\"http://www.opengis.net/kml/2.2\"" 
              + " xmlns:gx=\"http://www.google.com/kml/ext/2.2\""
              + " xmlns:kml=\"http://www.opengis.net/kml/2.2\""
              + " xmlns:atom=\"http://www.w3.org/2005/Atom\">\n"

RPD = Math.PI/180.0;  // radians per degree
DPR = 180.0/Math.PI;  // degrees per radian

ERa   = 6378137.0;      // Earth ellipsoidal model equatorial radius (meters)
ERb   = 6356752.3;      // Earth ellipsoidal model polar radius (meters) 
ERm   = 6371008.77;     // Earth spherical model mean radius (meters)
Erot  = 7.2921159e-5;   // Earth rotation rate (radians/sec)
g     = 9.80665;        // Earth sea level gravitational acceleration (m/sec^2)

// Bearing Calculator - global variables

var versDiv = null;            // HTML DOM <div> element for version id.
var earthRadius = ERm/1000.0;  // Earth radius (km)
var inKML = "";                // User input KML string
var outKML = "";               // Calculator output KML string

// Latitude,Longitude Coordinate Pseudo Class (pg 16 of [1])
//
// References:
//   [1] http://cintos.org/ge/ForumPosts/GE_Community_Page3.pdf

function LatLon (newLat, newLon) {

    var that = this;

    PI  = Math.PI;
    RPD = PI / 180.0;
    DPR = 180.0 / PI; 
    
    // Initialize LatLon properties

    this.Lat = 0.0;
    if ( newLat != undefined ) {
       this.Lat = newLat;
    };
    this.Lon = 0.0;
    if ( newLon != undefined ) {
       this.Lon = newLon;
    };
    this.lat = this.Lat * RPD;
    this.lon = this.Lon * RPD;
    if ( newLat != undefined && newLon != undefined)
    this.LonLatGE = this.Lon.toFixed(8) + "," + this.Lat.toFixed(8) + ",0";

    // Privileged methods

    function setlatlon () {
        that.lat = that.Lat*RPD;
        that.lon = that.Lon*RPD;
    };
    
    function setLonLatGE () {
        that.LonLatGE = that.Lon.toFixed(8) + "," + that.Lat.toFixed(8) + ",0";
    };

    setlatlon();
    setLonLatGE();

    // Public methods
    
    this.setLatLon = function (newLat, newLon) {
        this.Lat = newLat;
        this.Lon = newLon;
        setlatlon();
        setLonLatGE();
    };

    this.getLatLonCoord = function () {
        var LatLon = new Array(2);
        LatLon[0] = this.Lat;
        LatLon[1] = this.Lon;
        return LatLon;
    };

    this.getlatlonCoord = function () {
        var latlon = new Array(2);
        latlon[0] = this.lat;
        latlon[1] = this.lon;
        return latlon;
    };
};

// Saginaw Bay Impactor Crater parameters

var sbayCentroid = new LatLon(43.68, -83.82);     // centroid location
var sbayLength   = 280.0;                         // major axis distance (km)
var sbayBearing  = 221;                           // arrival bearing (deg)
//var sbayRampartSW = new LatLon(42.724, -84.944);  // Southwest rampart location
//var sbayRampartNE = new LatLon(44.624, -82.659);  // Northeast rampart location
var sbayRampartSW = LatLonFromBearing(sbayCentroid.lat, sbayCentroid.lon, 
                                      sbayBearing*RPD, sbayLength/2);
var sbayRampartNE = LatLonFromBearing(sbayCentroid.lat, sbayCentroid.lon,
                                     (sbayBearing-180)*RPD, sbayLength/2);

// Saginaw Bay Impactor Ejecta Parameters

var inpVavg = null;   // HTML DOM element for input average flight velocity value
var inpCd = null;     // HTML DOM element for input drag coefficient value
var inpRho = null;    // HTML DOM element for input mass density value
var inpGamma = null;  // HTML DOM element for input incidence angle value

var default_Vavg = 3.0;    // default average flight velocity (km/sec)
var default_Cd = 0.3;      // default drag coefficient 
var default_Rho = 2000.0;  // default mass density (kg/m^3)
var default_Gamma = 45.0;  // default incidence angle (deg)

var Vavg  = default_Vavg;
var Cd    = default_Cd; 
var Rho   = default_Rho;
var Gamma = default_Gamma;

var ref_Diameter = 1.0;                             // reference spherical diameter (m)
var ref_Radius   = ref_Diameter/2;                  // reference spherical radius (m)
var ref_Area     = Math.PI*Math.pow(ref_Radius,2);  // reference circular area (m^2)
var ref_Volume   = (4/3)*ref_Area*ref_Radius;       // reference 1m spherical volume (m^3)
var ref_Volume   = ref_Area;                        // reference 1m cylindrical volume (m^3)
var ref_Mass     = ref_Volume*default_Rho;          // reference mass (kg)
var ref_Weight   = ref_Mass*g;                      // reference weight (Newtons)

// Carolina Bay Inferred Bearing Calculation - Variables

var bayLoc      = new LatLon ();
var arrowBoxNE  = new LatLon (); 
var arrowBoxSW  = new LatLon ();
var elementName = "";
var bayBearingFromArrow = 0.0;
var userPoint = false;
var userArrow = false;
var loftTime_C = 0.0;
var loftDistance_C = 0.0;
var offsetDistance_C = 0.0;

// Carolina Bay Inferred Bearing Calculation - Functions

function TangentVel (lat) {
    // Given latitude in radians, returns ground level tagent velocity (km/sec)
    // due to Earth's rotation.
    var v = earthRadius * Math.cos(lat) * Erot;
    return (v);
};

function TerminalVel (W, Cd, A) {
    // Given an object's weight (Newtons), drag coefficient Cd, and frontal area A (m^2),
    // return terminal velocity (km/sec) (sec 1.2.1 of [2]).
    //
    // References:
    //   [1] http://cintos.org/SaginawManifold/BearingCalc/Code_Discussion/index.html
    //   [2] http://cintos.org/SaginawManifold/styled-75/styled-78/index.html
    var p = 1.225;  // sea level air density (kg/m^3)
    var v = Math.sqrt((2 * W) / (Cd * p * A))/1000.0;
    return v;
};

function GreatCircleDistance (lat1, lon1, lat2, lon2) {
    // Given latitude and longitude of forePoint [lat1,lon1] and farPoint [lat2,lon2] in
    // radians, return great circle distance in kilometers (pg 13 of [2]).
    //
    // References: 
    //   [1] http://cintos.org/SaginawManifold/BearingCalc/Code_Discussion/index.html
    //   [2] http://cintos.org/ge/ForumPosts/GE_Community_Page3.pdf
    var dLat = (lat2 - lat1);
    var dLon = (lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) 
          + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return (earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

function GreatCircleBearing (lat1, lon1, lat2, lon2) {
    // Given latitude and longitude of forePoint [lat1,lon1] and farPoint [lat2,lon2] in
    // radians, returns bearing from farPoint to forePoint in radians in range [0,2pi] 
    // (pp 13-14 of [2]).
    //
    // References:
    //   [1] http://cintos.org/SaginawManifold/BearingCalc/Code_Discussion/index.html
    //   [2] http://cintos.org/ge/ForumPosts/GE_Community_Page3.pdf
    var dLon = (lon2 - lon1);
    var y = Math.sin(dLon) * Math.cos(lat2);
    var x = Math.cos(lat1) * Math.sin(lat2)
          - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    var bearing = 180.0 + (Math.atan2(y, x) * DPR);
    return (bearing * RPD);
};

function LatLonFromBearing(foreLat, foreLon, bearing, distance) {
    // Returns a LatLon object from coordinate [foreLat, foreLon] and along
    // bearing given in radians out to given distance in kilometers (pg 14 of [2]).
    // 
    // References:
    //   [1] http://cintos.org/SaginawManifold/BearingCalc/Code_Discussion/index.html
    //   [2] http://cintos.org/ge/ForumPosts/GE_Community_Page3.pdf
    var farLat = Math.asin(Math.sin(foreLat) * Math.cos(distance / earthRadius) 
               + Math.cos(foreLat) * Math.sin(distance / earthRadius) * Math.cos(bearing));
    var farLon = foreLon + Math.atan2(Math.sin(bearing) * Math.sin(distance / earthRadius) * Math.cos(foreLat),
                                      Math.cos(distance / earthRadius) - Math.sin(foreLat) * Math.sin(farLat));
    return (new LatLon (farLat*DPR, farLon*DPR));
};

function GEpathFromBearing (foreLat, foreLon, bearing, distance) {
    // Returns a KML string to place a path from coordinate [foreLat, foreLon] and along
    // bearing given in radians out to given distance in kilometers (pg 14 of [2]).
    // 
    // References:
    //   [1] http://cintos.org/SaginawManifold/BearingCalc/Code_Discussion/index.html
    //   [2] http://cintos.org/ge/ForumPosts/GE_Community_Page3.pdf
    var startKML = "    <LineString>\n      <tessellate>1</tessellate>\n      <coordinates>";
    var endKML = "</coordinates>\n    </LineString>\n";
    var foreLatLon = new LatLon (foreLat*DPR, foreLon*DPR);
    var farLatLon = LatLonFromBearing(foreLat, foreLon, bearing, distance);
    return (startKML + foreLatLon.LonLatGE + " " + farLatLon.LonLatGE + endKML);
};

function LookAtKML (Lat, Lon, alt, heading, tilt, range) {
    // Returns a KML string for a LookAt element with the given 
    // Lat, Lon, heading & tilt values in degrees and alt & range
    // values in meters.  
    var kml = "    <LookAt>\n"
	      + "      <longitude>" + Lon.toFixed(8) + "</longitude>\n"
            + "      <latitude>" + Lat.toFixed(8) + "</latitude>\n"
            + "      <altitude>" + alt.toFixed(0) + "</altitude>\n"
	      + "      <heading>" + heading.toFixed(5) + "</heading>\n"
            + "      <tilt>" + tilt.toFixed(2) + "</tilt>\n"
	      + "      <range>" + range.toFixed(4) + "</range>\n"
	      + "      <gx:altitudeMode>relativeToSeaFloor</gx:altitudeMode>\n"
	      + "    </LookAt>\n";
    return (kml);
};

function PointPlacemarkKML (name, styleUrl, Lat, Lon) {
    // Returns a KML string to place a named Point Placemark at given 
    // Lat, Lon values in degrees.
    debugPrint("Lat1, Lon1 (deg) = " + Lat.toFixed(8) + ", " + Lon.toFixed(8));
    var kml = "  <Style id=\"sn_arrow\">\n"
		+ "    <IconStyle>\n"
		+ "      <color>ff9c8dff</color>\n"
		+ "      <scale>0.5</scale>\n"
		+ "      <Icon>\n"
		+ "	     <href>http://maps.google.com/mapfiles/kml/shapes/arrow.png</href>\n"
		+ "      </Icon>\n"
		+ "    </IconStyle>\n"
            + "  </Style>\n"
            + "  <Placemark>\n"
            + "    <name>" + name + "</name>\n"
            + "    <styleUrl>" + styleUrl + "</styleUrl>\n"
            + "    <Point>\n"
            + "       <coordinates>" + Lon.toFixed(8) + "," + Lat.toFixed(8) + ",0</coordinates>\n"
            + "    </Point>\n"
            + "  </Placemark>\n";
    return (kml);
};

function LineStringPlacemarkKML (name, styleUrl, Lat1, Lon1, Lat2, Lon2) {
    // Returns a KML string to place a named LineString Placemark between
    // given pair of Lat, Lon values in degrees.
    debugPrint("Lat1, Lon1 (deg) = " + Lat1.toFixed(8) + ", " + Lon1.toFixed(8));
    debugPrint("Lat2, Lon2 (deg) = " + Lat2.toFixed(8) + ", " + Lon2.toFixed(8));
    var kml = "  <Placemark>\n"
            + "    <name>" + name + "</name>\n"
            + "    <styleUrl>" + styleUrl + "</styleUrl>\n"
            + "    <LineString>\n"
            + "      <tessellate>1</tessellate>\n"
            + "      <coordinates>\n"
            + "        " + Lon1.toFixed(8) + "," + Lat1.toFixed(8) + ",0\n" 
            + "        " + Lon2.toFixed(8) + "," + Lat2.toFixed(8) + ",0\n"
            + "      </coordinates>\n"
            + "    </LineString>\n"
            + "  </Placemark>\n";
    return (kml);
};

function BearingPathPlacemarkKML (name, styleUrl, lat, lon, bearing, distance) {
    // Returns a KML string to place a named LineString Placemark for a path
    // from lat lon coordinates and along bearing given in radians for the 
    // specified distance in km.
    var kml = "  <Placemark>\n"
            + "    <name>" + name + "</name>\n"
            + "    <styleUrl>" + styleUrl + "</styleUrl>\n"
            + GEpathFromBearing (lat, lon, bearing, distance)
            + "  </Placemark>\n";
    return (kml);
};

function BearingArrowKML (name, lat, lon, bearing) {
    // Returns a KML string to place a Bearing Arrow at a bay site given 
    // lat, lon and bearing inputs in radians (pp 14-15 of [2]).
    //
    // References:
    //   [1] http://cintos.org/SaginawManifold/styled-75/styled-78/index.html
    //   [2] http://cintos.org/ge/ForumPosts/GE_Community_Page3.pdf

    var distance = 2;  // km for building latlon box
    var LatLonNE = LatLonFromBearing(lat, lon, 45*RPD, distance);
    var LatLonSW = LatLonFromBearing(lat, lon, 225*RPD, distance);
    var rotBox   = (360 - bearing*DPR) % 360;  // clockwise to counterclockwise

    var kml = "  <GroundOverlay>\n"
            + "    <name>" + name + "</name>\n"
            + "    <description><![CDATA[Bearing Arrow Overlay <br>"
            + "<a href= \"http://cintos.org/SaginawManifold/BearingCalc/index.html\"> " 
            + "Bearing Calculator V" + VERS + " </a> <br> © Cintos 2010]]></description>\n"
            + LookAtKML(lat*DPR, lon*DPR, 0.0, 0.098673, 0.0, 5902.85762)
            + "    <color>7dffffff</color>\n"
            + "    <drawOrder>6</drawOrder>\n"
            + "    <Icon>\n"
            + "      <href>http://cintos.org/ge/overlays/Bearing_Arrow.png</href>\n"
            + "      <viewBoundScale>0.75</viewBoundScale>\n"
            + "    </Icon>\n"
            + "    <LatLonBox>\n"
            + "      <north>" + LatLonNE.Lat.toFixed(8) + "</north>\n"
            + "      <south>" + LatLonSW.Lat.toFixed(8) + "</south>\n"
            + "      <east>" + LatLonNE.Lon.toFixed(8) + "</east>\n"
            + "      <west>" + LatLonSW.Lon.toFixed(8) + "</west>\n"
            + "      <rotation>" + rotBox.toFixed(5) + "</rotation>\n"
            + "    </LatLonBox>\n"
            + "  </GroundOverlay>\n";
    return (kml);
};

function PredictedBearingsKML (lat, lon, rotC, rotNE, rotSW) {
    // Returns a KML string specifying predicted bearings line strings for
    // the bay site given lat, lon and rotation inputs in radians (pp 14-15 of [2]).
    //
    // References:
    //   [1] http://cintos.org/SaginawManifold/styled-75/styled-76/index.html
    //   [2] http://cintos.org/ge/ForumPosts/GE_Community_Page3.pdf

    var distance = 50;  // km for line segments to crater ramparts
    var kml = KML_DOCSTRING
            + "<Document>\n"
            + "  <name>Bearing Predictions for " + elementName + " @ " + loftTime_C.toFixed(2) + " min</name>\n"
            + "  <open>1</open>\n"
            + "  <description>Predicted Bearings from Placemark  V " + VERS + " © Cintos 2010\n"
            + "  \n"
            + "  Avg Velocity = " + Vavg.toFixed(2) + " km/sec\n"
            + "  Cd = " + Cd.toFixed(2) + "\n"
            + "  Density = " + Rho.toFixed(1) + " kg/m^3\n"
            + "  Incidence Angle = " + Gamma.toFixed(1) + "º\n"
            + "  Loft Time = " + loftTime_C.toFixed(2) + " min\n"
            + "  Loft Distance = " + loftDistance_C.toFixed(1) + " km\n"
            + "  </description>\n"
            + "  <Style id=\"NE_path\">\n"
            + "    <LineStyle>\n"
            + "       <color>ff23fffd</color>\n"
            + "       <width>1</width>\n"
            + "    </LineStyle>\n"
            + "  </Style>\n"
            + "  <Style id=\"SW_path\">\n"
            + "    <LineStyle>\n"
            + "       <color>ffd83cff</color>\n"
            + "       <width>1</width>\n"
            + "    </LineStyle>\n"
            + "  </Style>\n"
            + PointPlacemarkKML (elementName, "#sn_arrow", lat*DPR, lon*DPR)
            + BearingPathPlacemarkKML ("SW Rampart", "#SW_path", lat, lon, rotSW, distance)
            + BearingArrowKML (elementName, lat, lon, rotC)
            + BearingPathPlacemarkKML ("NE Rampart", "#NE_path", lat, lon, rotNE, distance)
            + "</Document>\n</kml>\n";
    return (kml);
};

function DeSkewedAlignmentKML (lat0, lon0, rot0, lat1, lon1, rot1) {
    // Returns a KML string specifying de-skewed alignment line strings for
    // the given lat, lon and rot inputs in radians (pp 14-15 of [2]).
    //
    // References:
    //   [1] http://cintos.org/SaginawManifold/styled-75/styled-77/index.html
    //   [2] http://cintos.org/ge/ForumPosts/GE_Community_Page3.pdf

    var dist0 = 50;    // user input inferred bearing path distance (km)
    var dist1 = 1400;  // deskewed loft bearing path distance (km)

    var kml = KML_DOCSTRING
            + "<Document>\n"
            + "  <name>De-Skewed Alignment for " + elementName + " @ " + loftTime_C.toFixed(2) + " min</name>\n"
            + "  <open>1</open>\n"
            + "  <description>De-Skewed Alignment to Crater  V " + VERS + "\n© Cintos 2010\n"
            + "  \n"
            + "  Bearing Arrow input on " + bayBearingFromArrow.toFixed(2) + "º inferred arrival\n"
            + "  \n"
            + "  Avg Velocity = " + Vavg.toFixed(2) + " km/sec\n"
            + "  Cd = " + Cd.toFixed(2) + "\n"
            + "  Density = " + Rho.toFixed(1) + " kg/m^3\n"
            + "  Incidence Angle = " + Gamma.toFixed(1) + "º\n"
            + "  Loft Time = " + loftTime_C.toFixed(2) + " min\n"
            + "  Offset Distance = " + offsetDistance_C.toFixed(1) + " km\n"
            + "  </description>\n"
            + "  <Style id=\"userBearing\">\n"
            + "    <LineStyle>\n"
            + "       <color>ff3005ff</color>\n"
            + "       <width>1</width>\n"
            + "    </LineStyle>\n"
            + "  </Style>\n"
            + "  <Style id=\"Rotate\">\n"
            + "    <LineStyle>\n"
            + "       <color>80d83cff</color>\n"
            + "       <width>1</width>\n"
            + "    </LineStyle>\n"
            + "  </Style>\n"
            + "  <Style id=\"Loft\">\n"
            + "    <LineStyle>\n"
            + "       <color>ff23fffd</color>\n"
            + "       <width>2</width>\n"
            + "    </LineStyle>\n"
            + "  </Style>\n"
            + PointPlacemarkKML (elementName, "#sn_arrow", lat0*DPR, lon0*DPR)
            + BearingPathPlacemarkKML ("Arrow-Provided Bearing", "#userBearing", lat0, lon0, rot0, dist0)
            + LineStringPlacemarkKML ("Loft Time Offset", "#Rotate", lat0*DPR, lon0*DPR, lat1*DPR, lon1*DPR)
            + BearingPathPlacemarkKML ("deSkewed Loft", "#Loft", lat1, lon1, rot1, dist1)
            + "</Document>\n</kml>\n";
    return (kml);
};

// Global constants for parseInputKML() and supporting user input option
// functions pointCaseCoordinates() and arrowCaseCoordinates() (pg 17 of[2]).
//
// References:
//   [1] http://cintos.org/SaginawManifold/styled-75/index.html
//   [2] http://cintos.org/ge/ForumPosts/GE_Community_Page3.pdf

kmlPoint = "<Point>";
kmlLineString = "<LineString>";
kmlCoordinates = "<coordinates>";
kmlPlaceName = "<Placemark>";
kmlLatLonBox = "<LatLonBox>";
comaDelim = ",";
nameDelim = "</";
nameFlag = "<name>";
northFlag = "<north>";
southFlag = "<south>";
eastFlag = "<east>";
westFlag = "<west>";
rotationFlag = "<rotation>";

function PointCaseCoordinates (linePos) { 
    // Sets global bayLoc object Lat and Lon values to that 
    // parsed from input KML string starting at linePos (pg 17 of [2]).
    //
    // References:
    //   [1] http://cintos.org/SaginawManifold/styled-75/styled-76/index.html
    //   [2] http://cintos.org/ge/ForumPosts/GE_Community_Page3.pdf
    var cordPosition, comaPosition;
    var lon1Start, lat1Start;
    var Lon1, Lat1;

    cordPosition = inKML.indexOf(kmlCoordinates, linePos); 
    lon1Start = cordPosition + 13; 
    comaPosition = inKML.indexOf(comaDelim, lon1Start); 
    Lon1 = parseFloat(inKML.substring(lon1Start, comaPosition));
    lat1Start = comaPosition + 1; 
    comaPosition = inKML.indexOf(comaDelim, lat1Start); 
    Lat1 = parseFloat(inKML.substring(lat1Start, comaPosition)); 
    bayLoc.setLatLon(Lat1, Lon1);
};

function ArrowCaseCoordinates (linePos) {
    // Sets global bayLoc object Lat and Lon values, and global
    // bayBearingFromArrow value to that parsed from input KML
    // string starting at linePos (pp 17-18 of [2]).
    //
    // References:
    //   [1] http://cintos.org/SaginawManifold/styled-75/styled-77/index.html
    //   [2] http://cintos.org/ge/ForumPosts/GE_Community_Page3.pdf
    var coordPosition, coordEnd;
    var LatNE, LonNE, LatSW, LonSW, rotation;

    // north
    coordPosition = inKML.indexOf(northFlag , linePos);
    coordEnd = inKML.indexOf(nameDelim, coordPosition);
    LatNE = parseFloat( inKML.substring(coordPosition + 7, coordEnd) );
    // south 
    coordPosition = inKML.indexOf(southFlag , coordEnd);
    coordEnd = inKML.indexOf(nameDelim, coordPosition);
    LatSW = parseFloat( inKML.substring(coordPosition + 7, coordEnd) ); 
    // east
    coordPosition = inKML.indexOf(eastFlag , linePos); 
    coordEnd = inKML.indexOf(nameDelim, coordPosition);
    LonNE = parseFloat( inKML.substring(coordPosition + 6, coordEnd) );
    // west
    coordPosition = inKML.indexOf(westFlag , coordEnd);
    coordEnd = inKML.indexOf(nameDelim, coordPosition);
    LonSW = parseFloat( inKML.substring(coordPosition + 6, coordEnd) );

    // location : lat, lon computed as centroid of arrowBox
    arrowBoxNE.setLatLon( LatNE, LonNE ); 
    arrowBoxSW.setLatLon( LatSW, LonSW ); 
    bayLoc.setLatLon( (arrowBoxNE.Lat + arrowBoxSW.Lat)/2, (arrowBoxNE.Lon + arrowBoxSW.Lon)/2 );
 
    // rotation : note that provided bearing is counterclockwise ...
    coordPosition = inKML.indexOf(rotationFlag, coordEnd);
    coordEnd = inKML.indexOf(nameDelim, coordPosition); 
    rotation = parseFloat( inKML.substring(coordPosition + 10, coordEnd) );
    bayBearingFromArrow = (360.0 - rotation) % 360;
};

function ParseInputKML () {
    // Parses user input KML string to acquire bay's name, location and
    // optionally its bearing (pp 16-17 of [2]).
    //
    // References:
    //   [1] http://cintos.org/SaginawManifold/styled-75/index.html
    //   [2] http://cintos.org/ge/ForumPosts/GE_Community_Page3.pdf

    inKML = inpKML.value;

    debugPrint(escape(inKML));

    userPoint = false;
    userArrow = false;

    var placemarkPt;
    var namePtr, nameEnd;

    var linePos = inKML.indexOf(kmlPoint);

    if (linePos != -1) {   
        // do user point option
        userPoint = true;
        placemarkPt = inKML.indexOf(kmlPlaceName);
        namePtr = inKML.indexOf(nameFlag, placemarkPt);
        namePtr = namePtr + 6;
        nameEnd = inKML.indexOf(nameDelim, namePtr);
        elementName = inKML.substring(namePtr, nameEnd);
        PointCaseCoordinates(linePos);
    } else {
        linePos = inKML.indexOf(kmlLatLonBox);
        if (linePos != -1) {   
            // do user arrow option
            userArrow = true;
            namePtr = inKML.indexOf(nameFlag);
            namePtr = namePtr + 6;
            nameEnd = inKML.indexOf(nameDelim, namePtr);
            elementName = inKML.substring(namePtr, nameEnd);
            ArrowCaseCoordinates(linePos);
        } else {
            elementName = "No Name";
        };
    };
};

function LoftTimeFromCraterLoc (craterLoc) {
    // Calculates and returns loft time in minutes from crater location to bay location.
    var loftDistance = GreatCircleDistance(bayLoc.lat, bayLoc.lon, craterLoc.lat, craterLoc.lon);
    debugPrint("loftDistance (km) = " + loftDistance.toFixed(4));
    var loftTime  = (loftDistance / Vavg) / 60;
    return (loftTime);
};

function OffsetTargetLoc (loftTime) {
    // Returns offset target location cooresponding to given loft time in minutes.
    var offsetLon = loftTime / 4;
    debugPrint("offsetLon (deg) = " + offsetLon.toFixed(4));
    var tgtLoc =  new LatLon(bayLoc.Lat, bayLoc.Lon + offsetLon);
    return (tgtLoc);
};

function skewBaseBearing (baseBearing, targetLoc, craterLoc) {
    // Apply latitude difference adjustment to given base bearing in radians
    // and return as predicted bearing in [0,360] degrees (sec 1.2.4 of [2]).
    //
    // References:
    //   [1] http://cintos.org/SaginawManifold/styled-75/index.html
    //   [2] http://cintos.org/SaginawManifold/styled-75/styled-78/index.html

    var deltaV;            // ground speed of targetLoc wrt craterLoc (km/sec)
    var NScomponent;       // terminal velocity NS component in ground plane (km/sec)
    var EWcomponent;       // terminal velocity EW component in ground plane (km/sec)
    var componentBearing;  // skewed bearing angle wrt to North [-pi.pi] (radians)
    var predictedBearing;  // skewed bearing compass heading [0,360] (degrees)

    deltaV = TangentVel(targetLoc.lat) - TangentVel(craterLoc.lat);
    debugPrint("deltaV (m/sec)      = " + (deltaV*1000).toFixed(4));
    NScomponent = h_termV * Math.cos(baseBearing);
    debugPrint("NScomponent (m/sec) = " + (NScomponent*1000).toFixed(4));
    EWcomponent = h_termV * Math.sin(baseBearing) + deltaV;
    debugPrint("EWcomponent (m/sec) = " + (EWcomponent*1000).toFixed(4));
    //componentBearing = Math.acos(EWcomponent / h_termV);
    componentBearing = Math.atan2(EWcomponent, 
                                  Math.sign(NScomponent) *
                                  Math.sqrt(h_termVsq - Math.pow(EWcomponent,2)));
    debugPrint("componentBearing (deg) = " + (componentBearing*DPR).toFixed(4));
    //latQuadrant = Math.floor(baseBearing*DPR / 90);
    //predictedBearing = (componentBearing * DPR) + (latQuadrant * 90);
    predictedBearing = (360 + componentBearing*DPR) % 360;
    return (predictedBearing);
};

function deskewInferredBearing (inferredBearing, targetLoc, craterLoc) {
    // Apply latitude difference adjustment to given inferred bearing in radians 
    // and return as de-skewed bearing in [0-360] degrees (sec 1.2.4 of [2]).
    //
    // References:
    //   [1] http://cintos.org/SaginawManifold/Modeling/styled-71/page121.html
    //   [2] http://cintos.org/SaginawManifold/styled-75/styled-78/index.html

    var deltaV;            // ground speed of targetLoc wrt craterLoc (km/sec)
    var NScomponent;       // terminal velocity NS component in ground plane (km/sec)
    var EWcomponent;       // terminal velocity EW component in ground plane (km/sec)
    var componentBearing;  // deskewed bearing angle wrt to North [-pi.pi] (radians)
    var deskewedBearing;   // deskewed bearing compass heading [0,360] (degrees)

    deltaV = TangentVel(targetLoc.lat) - TangentVel(craterLoc.lat);
    debugPrint("deltaV (m/sec)      = " + (deltaV*1000).toFixed(4));
    NScomponent = h_termV * Math.cos(inferredBearing);
    debugPrint("NScomponent (m/sec) = " + (NScomponent*1000).toFixed(4));
    EWcomponent = h_termV * Math.sin(inferredBearing) - deltaV;
    debugPrint("EWcomponent (m/sec) = " + (EWcomponent*1000).toFixed(4));
    //componentBearing = Math.acos(EWcomponent / h_termV);
    componentBearing = Math.atan2(EWcomponent, 
                                  Math.sign(NScomponent) *
                                  Math.sqrt(h_termVsq - Math.pow(EWcomponent,2)));
    debugPrint("componentBearing (deg) = " + (componentBearing*DPR).toFixed(4));
    //latQuadrant_C = Math.floor(inferredBearing*DPR / 90);
    //deskewedBearing = (componentBearing * DPR) + (latQuadrant * 90);
    deskewedBearing = (360 + componentBearing*DPR) % 360;
    return (deskewedBearing);
};

function CalcPredictedBearings () {
    // Calculate predicted bearings from a user input GE KML string
    // containing a Carolina Bay Placemark element (sec 1.2.2, 1.2.3 
    // & 1.2.4 of [2]).
    //
    // References:
    //   [1] http://cintos.org/SaginawManifold/styled-75/index.html
    //   [2] http://cintos.org/SaginawManifold/styled-75/styled-78/index.html

    var statusText = "Predicted Bearings @ " + elementName;
    document.getElementById('div-status').innerHTML = "Status of Activity: " + statusText;
    
    debugPrint("<code>");

    // Determine target offset longitude (sec 1.2.2 of [2]).
    loftTime_C = LoftTimeFromCraterLoc(sbayCentroid);
    debugPrint("loftTime_C (min) = " + loftTime_C.toFixed(4));
    loftDistance_C = (loftTime_C * 60) * Vavg;
    tgtLoc_C = OffsetTargetLoc(loftTime_C);
    offsetDistance_C = GreatCircleDistance(bayLoc.lat, bayLoc.lon, tgtLoc_C.lat, tgtLoc_C.lon);
    debugPrint("offsetDistance_C (km) = " + offsetDistance_C.toFixed(4));

    loftTime_NE = LoftTimeFromCraterLoc(sbayRampartNE);
    debugPrint("loftTime_NE (min) = " + loftTime_NE.toFixed(4));
    tgtLoc_NE = OffsetTargetLoc(loftTime_NE);
    offsetDistance_NE = GreatCircleDistance(bayLoc.lat, bayLoc.lon, tgtLoc_NE.lat, tgtLoc_NE.lon);
    debugPrint("offsetDistance_NE (km) = " + offsetDistance_NE.toFixed(4));

    loftTime_SW = LoftTimeFromCraterLoc(sbayRampartSW);
    debugPrint("loftTime_SW (min) = " + loftTime_SW.toFixed(4));
    tgtLoc_SW = OffsetTargetLoc(loftTime_SW);
    offsetDistance_SW = GreatCircleDistance(bayLoc.lat, bayLoc.lon, tgtLoc_SW.lat, tgtLoc_SW.lon);
    debugPrint("offsetDistance_SW (km) = " + offsetDistance_SW.toFixed(4));

    // Determine baseline bearings (sec 1.2.3 of [2]).
    baseBearing_C = GreatCircleBearing(tgtLoc_C.lat, tgtLoc_C.lon, sbayCentroid.lat, sbayCentroid.lon);
    debugPrint("baseBearing_C (deg)  = " + (baseBearing_C*DPR).toFixed(4));
    baseBearing_NE = GreatCircleBearing(tgtLoc_NE.lat, tgtLoc_NE.lon, sbayRampartNE.lat, sbayRampartNE.lon);
    debugPrint("baseBearing_NE (deg) = " + (baseBearing_NE*DPR).toFixed(4));
    baseBearing_SW = GreatCircleBearing(tgtLoc_SW.lat, tgtLoc_SW.lon, sbayRampartSW.lat, sbayRampartSW.lon);
    debugPrint("baseBearing_SW (deg) = " + (baseBearing_SW*DPR).toFixed(4));

    // Calculate terminal velocity and horizontal component (sec 1.2.4 of [2]).
    termV = TerminalVel(ref_Weight, Cd, ref_Area);
    debugPrint("termV (m/sec)   = " + (termV*1000).toFixed(4));
    h_termV = termV * Math.cos(Gamma*RPD);
    debugPrint("h_termV (m/sec) = " + (h_termV*1000).toFixed(4));
    h_termVsq = Math.pow(h_termV,2);

    // Apply latitude difference adjustments to base bearings (sec 1.2.4 of [2]).
    predictedBearing_C = skewBaseBearing(baseBearing_C, tgtLoc_C, sbayCentroid)*RPD;
    debugPrint("predictedBearing_C (deg)  = " + (predictedBearing_C*DPR).toFixed(4));
    predictedBearing_NE = ((skewBaseBearing(baseBearing_NE, tgtLoc_NE, sbayRampartNE) + 180) % 360)*RPD;
    debugPrint("predictedBearing_NE (deg) = " + (predictedBearing_NE*DPR).toFixed(4));
    predictedBearing_SW = ((skewBaseBearing(baseBearing_SW, tgtLoc_SW, sbayRampartSW) + 180) % 360)*RPD;
    debugPrint("predictedBearing_SW (deg) = " + (predictedBearing_SW*DPR).toFixed(4));

    // Generate Google Earth KML visualization elements.
    var kml = PredictedBearingsKML(bayLoc.lat, bayLoc.lon, 
                                   predictedBearing_C, 
                                   predictedBearing_NE, 
                                   predictedBearing_SW);
    outKML.innerHTML = kml;

    debugPrint("</code>");
};

function CalcDeSkewedAlignment () {
    // Calculate deskewed allignment from a user input GE KML string
    // containing a Carolina Bay GroundOverlay element (sec 1.2.2, 
    // 1.2.3 & 1.2.4 of [2]).
    //
    // References:
    //   [1] http://cintos.org/SaginawManifold/Modeling/index.html
    //   [2] http://cintos.org/SaginawManifold/styled-75/styled-78/index.html

    var statusText = "deSkew to Crater " + bayBearingFromArrow.toFixed(2) + "º @ " + elementName;
    document.getElementById('div-status').innerHTML = "Status of Activity: " + statusText;

    debugPrint("<code>");

    // Determine target offset longitude (sec 1.2.2 of [1]).
    loftTime_C = LoftTimeFromCraterLoc(sbayCentroid);
    debugPrint("loftTime_C (min) = " + loftTime_C.toFixed(4));
    loftDistance_C = (loftTime_C * 60) * Vavg;
    tgtLoc_C = OffsetTargetLoc(loftTime_C);
    offsetDistance_C = GreatCircleDistance(bayLoc.lat, bayLoc.lon, tgtLoc_C.lat, tgtLoc_C.lon);
    debugPrint("offsetDistance_C (km) = " + offsetDistance_C.toFixed(4));

    // Calculate terminal velocity and horizontal component (sec 1.2.4 of [1]).
    termV = TerminalVel(ref_Weight, Cd, ref_Area);
    debugPrint("termV (m/sec) = " + (termV*1000).toFixed(4));
    h_termV = termV * Math.cos(Gamma*RPD);
    debugPrint("h_termV (m/sec) = " + (h_termV*1000).toFixed(4));
    h_termVsq = Math.pow(h_termV,2);

    // Apply latitude difference adjustments to bay bearing from arrow (sec 1.2.4 of [1]).
    inferredBearing_C = bayBearingFromArrow*RPD;
    deskewedBearing_C = ((deskewInferredBearing(inferredBearing_C, tgtLoc_C, sbayCentroid) + 180) % 360)*RPD;
    debugPrint("deskewedBearing_C (deg) = " + (deskewedBearing_C*DPR).toFixed(4));

    // Generate Google Earth KML visualization elements.
    var userBearing = ((inferredBearing_C*DPR + 180) % 360)*RPD;
    var kml = DeSkewedAlignmentKML(bayLoc.lat, bayLoc.lon, userBearing, tgtLoc_C.lat, tgtLoc_C.lon, deskewedBearing_C);
    outKML.innerHTML = kml;

    debugPrint("</code>");
};

function ResetBearingCalcOutput () {
    document.getElementById('div-status').innerHTML = "Status of Activity:";
    outKML.innerHTML = "";
};

function setSBayParams () {
    versDiv.innerHTML="Version " + VERS + " " + VERS_DATE;
    var text1 = "Crater @ " + sbayCentroid.Lat.toFixed(2) + ", " + sbayCentroid.Lon.toFixed(2);
    var text2 = "Major axis (km) = " + sbayLength.toFixed(1);
    var text3 = "Arrival Bearing (deg) = " + sbayBearing.toFixed(0);
    var text123 = text1 + "&nbsp;&nbsp;&nbsp;&nbsp;" + text2 + "&nbsp;&nbsp;&nbsp;&nbsp;" + text3;
    document.getElementById('div-crater').innerHTML = text123;
    var text4 = "Rampart SW @ " + sbayRampartSW.Lat.toFixed(3) + ", " + sbayRampartSW.Lon.toFixed(3);
    var text5 = "Rampart NE @ " + sbayRampartNE.Lat.toFixed(3) + ", " + sbayRampartNE.Lon.toFixed(3);
    var text45 = text4 + "&nbsp;&nbsp;&nbsp;&nbsp;" + text5;
    document.getElementById('div-ramparts').innerHTML = text45;   
};

function setInputDefaults () {
    if ( inKML != "" ) { 
      inpKML.setAttribute('placeholder', inKML)
      inpKML.innerHTML = inKML;
    };
    inpVavg.setAttribute('value', default_Vavg.toString());
    inpCd.setAttribute('value', default_Cd.toString());
    inpRho.setAttribute('value', default_Rho.toString());
    inpGamma.setAttribute('value', default_Gamma.toString());
    ResetBearingCalcOutput();
};

// Functions to handle HTML page events and user initiated form/input actions.

function CalcBearing () {
    // Calculate predicted bearing from a user input GE KML string
    // containing a Carolina Bay Placemark or GroundOverlay element. 
    //
    // References:
    //   [1] http://cintos.org/SaginawManifold/Modeling/index.html
    //   [2] http://cintos.org/SaginawManifold/styled-75/index.html
    //   [3] http://cintos.org/SaginawManifold/styled-75/styled-76/index.html
    //   [4] http://cintos.org/SaginawManifold/styled-75/styled-77/index.html

    debugPrint("Generate button clicked.");
    ParseInputKML ();
    if ( userPoint ) {
        CalcPredictedBearings ();
    };
    if ( userArrow ) {
        CalcDeSkewedAlignment ();
    };
    return false;
};

function putInputValues () {
    debugPrint("Detected change to an input value.");
    Vavg = parseFloat(inpVavg.value);
    Cd = parseFloat(inpCd.value);
    Rho = parseFloat(inpRho.value);
    Gamma = parseFloat(inpGamma.value);
    ref_Mass   = ref_Volume*Rho;
    ref_Weight = ref_Mass*g;
    ResetBearingCalcOutput();
    return 0;
};

function resetInputDefaults () {
    debugPrint("Detected reset button click.");
    setInputDefaults ();
    return 0;
};

function InitBearingCalc () {
    debugPrint("Detected onload event.");
    versDiv  = document.getElementById('div-version');
    inpVavg  = document.getElementById('inpVavg');
    inpCd    = document.getElementById('inpCd');
    inpRho   = document.getElementById('inpRho');
    inpGamma = document.getElementById('inpGamma');
    inpKML   = document.getElementById('inpKML');
    outKML   = document.getElementById('outKML');
    setSBayParams();
    setInputDefaults();
    return 0;
};
