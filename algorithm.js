function clip(lines, poly)
{
    if(isConvex(poly))
    {
        var normals = getInnerNormalsOfPoly(poly);
        addNormalsToScene(normals, poly);
        for(var i = 0; i < lines.length; i++)
        {
            scene.innerLines[scene.innerLines.length] = Cyrus_Beck(lines[i], poly, normals);
        }
    }
    else alert("Polygon isn't convex");
}

function Cyrus_Beck(line, poly, normals)
{
    var P1 = [line[0], line[1]];
    var P2 = [line[2], line[3]];

    var P = function(t) { return [line[0] + (line[2] - line[0])*t, line[1] + (line[3] - line[1])*t]; }
    var D = [line[2]-line[0], line[3]-line[1]];

    var upperLimits = new Array();
    var lowerLimits = new Array();

    for(var i = 0; i < normals.length; i++)
    {
        var F = [poly[i*2], poly[i*2+1]];
        var W = [P1[0]-F[0], P1[1]-F[1]];
        var t = -(multiplyScalar(W, normals[i]))/(multiplyScalar(D, normals[i]));
        if(0 <= t && t <= 1)
        {
            if(multiplyScalar(D, normals[i]) > 0) lowerLimits[lowerLimits.length] = t;
            else upperLimits[upperLimits.length] = t; 
        }
    }

    P1 = P(Math.max.apply(null, lowerLimits));
    P2 = P(Math.min.apply(null, upperLimits));
    return [P1[0], P1[1], P2[0], P2[1]];
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