//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "line" shapes using svg:line
//------------------------------------------------------------------------------
d3plus.shape.line = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The D3 line function that determines what variables to use for x and y 
  // positioning, as well as line interpolation defined by the user.
  //----------------------------------------------------------------------------
  var line = d3.svg.line()
    .x(function(d){ return d.d3plus.x; })
    .y(function(d){ return d.d3plus.y; })
    .interpolate(vars.shape.interpolate.value)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Divide each line into it's segments. We do this so that there can be gaps 
  // in the line and mouseover.
  //
  // Then, create new data group from values to become small nodes at each 
  // point on the line.
  //----------------------------------------------------------------------------

  var hitarea = vars.style.data.stroke.width
  if (hitarea < 30) {
    hitarea = 30
  }
  
  selection.each(function(d){

    var step = 0,
        segments = [],
        nodes = [],
        temp = d3plus.utils.copy(d),
        group = d3.select(this)
        
    temp.values = []
    d.values.forEach(function(v,i,arr){
      nodes.push(v)
      var k = v[vars[vars.continuous_axis].key],
          index = vars.tickValues[vars.continuous_axis].indexOf(k)
          
      if (i+step == index) {
        temp.values.push(v)
        temp.key += "_"+segments.length
      }
      else {
        if (i > 0) {
          segments.push(temp)
          temp = d3plus.utils.copy(d)
          temp.values = []
        }
        temp.values.push(v)
        temp.key += "_"+segments.length
        step++
      }
      if (i == arr.length-1) {
        segments.push(temp)
      }
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Bind segment data to "paths"
    //--------------------------------------------------------------------------
    var paths = group.selectAll("path.line")
      .data(segments, function(d){
        return d.key
      })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // "paths" Enter
    //--------------------------------------------------------------------------
    paths.enter().append("path")
      .attr("class","line")
      .attr("d",function(d){ return line(d.values) })
      .call(d3plus.shape.style,vars)

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // "paths" Update
    //--------------------------------------------------------------------------
    paths
      .transition().duration(vars.style.timing.transitions)
        .attr("d",function(l){ return line(l.values) })
        .call(d3plus.shape.style,vars)

  
    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Bind node data to "rects"
    //--------------------------------------------------------------------------
    var rects = group.selectAll("rect.anchor")
      .data(nodes, function(d){
        return d.d3plus.id
      })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // "rects" Enter
    //--------------------------------------------------------------------------
    rects.enter().append("rect")
      .attr("class","anchor")
      .attr("id",function(d){
        return d.d3plus.id
      })
      .call(init)
      .call(d3plus.shape.style,vars)

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // "rects" Update
    //--------------------------------------------------------------------------
    rects
      .transition().duration(vars.style.timing.transitions)
        .call(update)
        .call(d3plus.shape.style,vars)

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // "rects" Exit
    //--------------------------------------------------------------------------
    rects.exit()
      .transition().duration(vars.style.timing.transitions)
        .call(init)
        .remove()

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create mouse event lines
    //--------------------------------------------------------------------------
    var mouse = group.selectAll("path.mouse")
      .data(segments, function(d){
        return d.key
      })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Mouse "paths" Enter
    //--------------------------------------------------------------------------
    mouse.enter().append("path")
      .attr("class","mouse")
      .attr("d",function(l){ return line(l.values) })
      .style("stroke","black")
      .style("stroke-width",hitarea)
      .style("fill","none")
      .style("stroke-linecap","round")
      .attr("opacity",0.25)

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Mouse "paths" Update
    //--------------------------------------------------------------------------
    mouse
      .on(d3plus.evt.over,function(m){
    
        if (!vars.frozen) {

          d3.select(this).style("cursor","pointer")
    
          var mouse = d3.event[vars.continuous_axis]
              positions = d3plus.utils.uniques(d.values,function(x){return x.d3plus[vars.continuous_axis]}),
              closest = d3plus.utils.closest(positions,mouse)
            
          var parent_data = d3.select(this.parentNode).datum()
          parent_data.data = d.values[positions.indexOf(closest)]
          parent_data.d3plus = d.values[positions.indexOf(closest)].d3plus
        
          d3.select(this.parentNode).selectAll("path.line")
            .transition().duration(vars.style.timing.mouseevents)
            .style("stroke-width",vars.style.data.stroke.width*2)
    
          d3.select(this.parentNode).selectAll("rect")
            .transition().duration(vars.style.timing.mouseevents)
            .style("stroke-width",vars.style.data.stroke.width*2)
            .call(update,2)
            
        }
    
      })
      .on(d3plus.evt.move,function(d){
        
        if (!vars.frozen) {
    
          var mouse = d3.event.x,
              positions = d3plus.utils.uniques(d.values,function(x){return x.d3plus.x}),
              closest = d3plus.utils.closest(positions,mouse)
            
          var parent_data = d3.select(this.parentNode).datum()
          parent_data.data = d.values[positions.indexOf(closest)]
          parent_data.d3plus = d.values[positions.indexOf(closest)].d3plus
          
        }
    
      })
      .on(d3plus.evt.out,function(d){
        
        if (!vars.frozen) {

          d3.select(this.parentNode).selectAll("path.line")
            .transition().duration(vars.style.timing.mouseevents)
            .style("stroke-width",vars.style.data.stroke.width)
    
          d3.select(this.parentNode).selectAll("rect")
            .transition().duration(vars.style.timing.mouseevents)
            .style("stroke-width",vars.style.data.stroke.width)
            .call(update)
            
          var parent_data = d3.select(this.parentNode).datum()
          delete parent_data.data
          delete parent_data.d3plus
          
        }
    
      })
      .transition().duration(vars.style.timing.transitions)
        .attr("d",function(l){ return line(l.values) })
        .style("stroke-width",hitarea)

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Mouse "paths" Exit
    //--------------------------------------------------------------------------
    mouse.exit().remove()
    
  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each anchor point on enter and exit.
  //----------------------------------------------------------------------------
  function init(n) {
    
    n
      .attr("x",function(d){
        return d.d3plus.x
      })
      .attr("y",function(d){
        return d.d3plus.y
      })
      .attr("width",0)
      .attr("height",0)
      
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each anchor point on update.
  //----------------------------------------------------------------------------
  function update(n,mod) {

    if (!mod) var mod = 0
    
    n
      .attr("x",function(d){
        return d.d3plus.x - ((d.d3plus.width/2)+(mod/2))
      })
      .attr("y",function(d){
        return d.d3plus.y - ((d.d3plus.height/2)+(mod/2))
      })
      .attr("width",function(d){
        return d.d3plus.width+mod
      })
      .attr("height",function(d){
        return d.d3plus.height+mod
      })
      .attr("rx",function(d){
        return (d.d3plus.width+mod)/2
      })
      .attr("ry",function(d){
        return (d.d3plus.height+mod)/2
      })
      
  }
  
}
