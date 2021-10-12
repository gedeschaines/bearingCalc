# bearingCalc

Code conversion of Cintos Research [Bearing Calculator](http://cintos.org/SaginawManifold/BearingCalc/index.html) from Java web applet to HTML web page embedded JavaScript.

The Bearing Calculator © 2010 Michael Davias can be run [HERE](https://gedeschaines.github.io/bearingCalc/bearingCalc.html).

Note:

Here are two simple methods to run this Bearing Calculator HTML/JavaScript web page on a local platform. For both methods, clone or download the repository to a work space directory.

If Python 3 is installed, go to the work space directory containing the `bearingCalc.hmtl` file and invoke Python 3's http.server with the following command.

    > python -m http.server 8000

Then open a web browser and enter URL `http://localhost:8000/bearingCalc.html` or `http://0.0.0.0:8000/bearingCalc.html` in the address bar to load the `bearingCalc.html` web page.

If Visual Studio Code is installed, open the `bearingCalc.html` file for editing and select Run Without Debugging, then choose a browser from the options offered to load the `bearingCalc.html` web page.

## Background

Although motivation to develop this HTML/JavaScript implementation of the defunct Bearing Calculator Java web applet variant was purely personal, the product is publicly available in keeping with [Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)](http://creativecommons.org/licenses/by-nc-sa/3.0) license terms and to hopefully revitalize interest in ongoing efforts to substantiate a correlation between Carolina Bay orientations and an hypothesized cosmic impact event at Saginaw Bay, Michigan.

## Disclaimer

In addition to the disclaimer stipulated within the [CC BY-NC-SA 3.0 license](https://creativecommons.org/licenses/by-nc-sa/3.0/legalcode) document, the following caveats should be recognized.

1. This conversion attempts to preserve functional features, but may introduce measurable computational differences due to documentation errors in reference material and incomplete knowledge of original Java web applet source code.

2. The vintage of Bearing Calculator reference material may introduce incorrect and broken hyperlinks.

3. The bearing calculation methodology may be obsolete, possiby superseded by more recent Carolina Bay survey data, orientation analysis techniques, and geological/archeological field studies.

## Attribution

Primary references for Bearing Calculator specific methods and functional features are as follows.

\[1] <http://cintos.org/SaginawManifold/styled-75/styled-78/index.html>

\[2] <http://cintos.org/ge/ForumPosts/GE_Community_Page3.pdf>

\[3] <http://cintos.org/SaginawManifold/styled-75/styled-76/index.html>

\[4] <http://cintos.org/SaginawManifold/styled-75/styled-77/index.html>

Secondarily, web page HTML and CSS elements, JavaScript integration with HTML DOM elements and JavaScript object-oriented design patterns were derived from example pages and scripts provided in the GitHub [jsRK4](https://github.com/gedeschaines/jsRK4) source repository.
