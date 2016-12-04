function clip(lines, wnd, outside)
{
    var poly = wnd.polygon;
    var result = new Array();
    if(isConvex(poly))
    {
        var normals = getInnerNormalsOfPoly(poly);
        var middlePoints = getMiddlePointsOfPoly(poly);
        for(var i = 0; i < middlePoints.length; i++)
        {
            wnd.normals[wnd.normals.length] = [middlePoints[i][0],middlePoints[i][1],middlePoints[i][0] + normals[i][0] * 10,middlePoints[i][1] + normals[i][1] * 10];
        }
        for(var i = 0; i < lines.length; i++)
        {
            var generatedLines = Cyrus_Beck(lines[i], poly, normals, outside);
            if(generatedLines[0]) result = result.concat(generatedLines[0]);
            //if(generatedLines[1]) scene.invisibleLines = scene.invisibleLines.concat(generatedLines[1]);
        }
        return result;
    }
    else alert("Polygon isn't convex");
}

//Returns array where
//[0] = visible line (can be null or line)
//[1] = array of invisible lines (length can be 0,1,2)
function Cyrus_Beck(line, poly, normals, outside)
{
    var P1 = [line[0], line[1]];
    var P2 = [line[2], line[3]];
    var oldLine = [P1[0], P1[1], P2[0], P2[1]];
    var result = [new Array(), [oldLine]];
    if(outside)
    {
        var temp = result[0];
        result[0] = result[1];
        result[1] = temp;
    }

    var P = function(t) { return [line[0] + (line[2] - line[0])*t, line[1] + (line[3] - line[1])*t]; }
    var D = [line[2]-line[0], line[3]-line[1]];
    if(D[0]!=0 || D[1]!=0)
    {
        var upperLimits = new Array();
        var lowerLimits = new Array();

        for(var i = 0; i < normals.length; i++)
        {
            var F = [poly[i*2], poly[i*2+1]];
            var W = [P1[0]-F[0], P1[1]-F[1]];
            var W2 = [P2[0]-F[0], P2[1]-F[1]];
            //account for trivially invisible segments
            if(multiplyScalar(W, normals[i]) < 0 && multiplyScalar(W2, normals[i])<0) return result;
            var t = -(multiplyScalar(W, normals[i]))/(multiplyScalar(D, normals[i]));
            if(0 <= t && t <= 1)
            {
                if(multiplyScalar(D, normals[i]) > 0) lowerLimits[lowerLimits.length] = t;
                else upperLimits[upperLimits.length] = t; 
            }
        }

        if(lowerLimits.length != 0 && upperLimits.length != 0)
        {
            var lowerLimit = Math.max.apply(null, lowerLimits);
            var upperLimit = Math.min.apply(null, upperLimits);
            if(lowerLimit < upperLimit)
            {
                P1 = P(lowerLimit);
                P2 = P(upperLimit);
                if(!isOnEdge(P1, poly) || !isOnEdge(P2, poly)) return result;
            }
            else return result;
        }
        else if(lowerLimits.length != 0 && upperLimits.length == 0)
        {
            P1 = P(Math.max.apply(null, lowerLimits));
            if(!isOnEdge(P1, poly)) return result;
        }
        else if(lowerLimits.length == 0 && upperLimits.length != 0)
        {
            P2 = P(Math.min.apply(null, upperLimits));
            if(!isOnEdge(P2, poly)) return result;
        }
        result[0] = [[P1[0], P1[1], P2[0], P2[1]]];
        result[1] = [[oldLine[0], oldLine[1], P1[0], P1[1]], [oldLine[2], oldLine[3], P2[0], P2[1]]];
        if(outside)
        {
            var temp = result[0];
            result[0] = result[1];
            result[1] = temp;
        }
        return result;
    }
    else return result;
}

function isOnEdge(dot, poly)
{
    for(var i = 0; i < poly.length; i+=2)
    {
        if(segmentContainsDot([poly[i], poly[i+1], poly[(i+2)%poly.length], poly[(i+3)%poly.length]], dot))
            return true;
    }
    return false;
}
function lineContainsDot(line, dot)
{
    var k = (line[3] - line[1]) / (line[2] - line[0]);
    var b = line[1] - k * line[0];
    var value = Math.abs(k*dot[0] - dot[1] + b);
    if(value == 0) return true;
    else return false;
}
function segmentContainsDot(segment, dot)
{
    var result = Math.min(segment[0], segment[2]) <= dot[0] && dot[0] <= Math.max(segment[0], segment[2]) &&
                 Math.min(segment[1], segment[3]) <= dot[1] && dot[1] <= Math.max(segment[1], segment[3]);
    //alert("dot: (" + dot[0]+";"+dot[1]+") | line: ("+segment[0]+";"+segment[1]+"), ("+segment[2]+";"+segment[3]+") Result: " + result);
    return  result;
}

//Returns array of unit normals to one of the poly's line segments 
function getNormalsOfPoly(poly)
{
    var normals = new Array();
    for(var i = 0; i < poly.length; i+=2)
    {
        normals[normals.length] = getLineNormal([poly[i], poly[i+1], poly[(i+2)%poly.length], poly[(i+3)%poly.length]]);
    }
    return normals;
}
function getInnerNormalsOfPoly(poly)
{
    var normals = getNormalsOfPoly(poly);
    if(multiplyScalar([poly[2]-poly[0], poly[3]-poly[1]], normals[1]) > 0)
        for(var i = 0; i < normals.length; i++)
        {
            normals[i] = multiplyByConst(normals[i], -1);
        }
    return normals;
}
function getOuterNormalsOfPoly(poly)
{
    var normals = getInnerNormalsOfPoly(poly);
    for(var i = 0; i < normals.length; i++)
    {
        normals[i] = multiplyByConst(normals[i], -1);
    }
    return normals;
}

function getMiddlePointsOfPoly(poly)
{
    var points = new Array();
    for(var i = 0; i < poly.length; i+=2)
    {
        points[points.length] = [(poly[i] + poly[(i+2)%poly.length])/2, (poly[i+1] + poly[(i+3)%poly.length])/2];
    }
    return points;
}

function getLineNormal(line)
{
    var dx = line[2] - line[0];
    var dy = line[3] - line[1];
    var length = Math.sqrt(dx*dx + dy*dy);
    return [dy/length, -dx/length];
}

function isConvex(poly)
{
    var positiveNumber = 0;
    var negativeNumber = 0;
    for(var i = 0; i < poly.length; i+=2)
    {
        var v1 = [poly[(i+2)%poly.length] - poly[i], poly[(i+3)%poly.length] - poly[i+1]];
        var v2 = [poly[(i+4)%poly.length] - poly[(i+2)%poly.length], poly[(i+5)%poly.length] - poly[(i+3)%poly.length]];
        if(v1[0]*v2[1] - v1[1]*v2[0] > 0)
            positiveNumber++;
        else negativeNumber++;
    }
    if(positiveNumber == 0 || negativeNumber == 0)
        return true;
    else return false;
}

function multiplyScalar(left_vector, right_vector)
{
    return left_vector[0] * right_vector[0] + left_vector[1] * right_vector[1];
}

function multiplyByConst(vector, value)
{
    return [vector[0] * value, vector[1] * value];
}