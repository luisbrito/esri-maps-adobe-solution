#-------------------------------------------------------------------------------
# Name:        module1
# Purpose:
#
# Author:      stev6855
#
# Created:     02/01/2015
# Copyright:   (c) stev6855 2015
# Licence:     <your licence>
#-------------------------------------------------------------------------------

import arcpy
from arcpy import env
import os

arcpy.env.overwriteOutput = True
outFolder = r"\\AMAZONA-E9QKVHO\directories\arcgisoutput"
Web_Map_as_JSON = arcpy.GetParameterAsText(0)

result = arcpy.mapping.ConvertWebMapToMapDocument(Web_Map_as_JSON)

mxd = result.mapDocument
out_path = os.path.join(scratchFolder + r"\out.pdf")

ai_out = arcpy.mapping.ExportToAI(mxd, out_path)
#arcpy.mapping.ExportToPDF(mxd, out_path)

arcpy.SetParameterAsText(1, out_path)
