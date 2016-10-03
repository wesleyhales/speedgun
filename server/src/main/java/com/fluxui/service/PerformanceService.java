package com.fluxui.service;


import com.fluxui.jms.PerfQueueManager;


import org.jboss.resteasy.annotations.GZIP;

import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.validation.ConstraintViolation;
import javax.validation.Validator;
import javax.ws.rs.*;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import java.io.*;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import java.util.logging.Logger;

@Path("/performance")
@RequestScoped
public class PerformanceService implements Serializable {

  @Inject
  PerfQueueManager perfQueueManager;

  @Inject
  private transient Logger log;

  @Inject
  private Validator validator;

  @Inject
  DBService postgresService;


  private static String OS = System.getProperty("os.name").toLowerCase();
  String LOCATION = "/root/jboss-as-7.1.1.Final-fluxui/";

  {
    if (OS.contains("mac")) {
      LOCATION = "/Users/wesleyhales/dev/speedgun/server/jboss-as-7.1.1.Final-fluxui/";
    }
  }

  private JsonObject readJSON(String data){
    JsonReader reader = Json.createReader(new StringReader(data));
    JsonObject myObject = reader.readObject();
    reader.close();
    return myObject;
  }


  @POST
  @Path("/imageData")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response imageData(String base64) {
  Response.ResponseBuilder builder = null;
  Map<String, String> responseObj = new HashMap<String, String>();

  if(!base64.isEmpty()) {

    JsonObject object = null;
    try {
      object = readJSON(base64);
    } catch (Exception e) {
      log.info("______debug: failure parsing json for image" + base64);
      e.printStackTrace();
      responseObj.put("error", "failure parsing JSON: " + base64);
      builder = Response.status(Response.Status.BAD_REQUEST).entity(responseObj);
      return builder.build();
    }

    try {
      java.sql.Connection con = postgresService.usePostgresDS();
      String query = "INSERT INTO imagedata (data) VALUES (?::jsonb);";
      PreparedStatement statement = con.prepareStatement(query);
      statement.setString(1, object.toString());
      statement.executeUpdate();
      statement.close();

    } catch (SQLException e) {
      e.printStackTrace();
    }
  }

    builder = Response.ok();
    builder.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    builder.header("Access-Control-Allow-Origin", "*");
    builder.header("Access-Control-Allow-Headers", "accept, origin, sg-variant, content-type");

    return builder.build();
  }

  @POST
  @Path("/reportData")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response reportData(String report) {
    Response.ResponseBuilder builder = null;
    Map<String, String> responseObj = new HashMap<String, String>();

    if(!report.isEmpty()) {

      JsonObject object = null;
      try {
        object = readJSON(report);
      } catch (Exception e) {
        e.printStackTrace();
        responseObj.put("error", "failure parsing JSON");
        builder = Response.status(Response.Status.BAD_REQUEST).entity(responseObj);
        return builder.build();
      }

      try {
        java.sql.Connection con = postgresService.usePostgresDS();
        String query = "INSERT INTO timingdata (data) VALUES (?::jsonb);";
        PreparedStatement statement = con.prepareStatement(query);
        statement.setString(1, object.toString());
        statement.executeUpdate();
        statement.close();

      } catch (SQLException e) {
        e.printStackTrace();
      }
    }

    builder = Response.ok();
    builder.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    builder.header("Access-Control-Allow-Origin", "*");
    builder.header("Access-Control-Allow-Headers", "accept, origin, sg-variant, content-type");

    return builder.build();
  }

  @GET
  @Path("/go")
  @Produces("text/html")
  public Response go(@QueryParam("url") String url, @QueryParam("cached") String cached, @QueryParam("email") String email) {


    Response.ResponseBuilder builder = null;
    String retVal = "";
    String response = "{}";
    String taskName = "performance";
    int position = 0;
    UUID random = UUID.randomUUID();

    boolean keepgoing = false;
    try {
      URL urltemp = new URL(url);
      URLConnection conn = urltemp.openConnection();
      conn.connect();
      keepgoing = true;
    } catch (MalformedURLException e) {
      // the URL is not in a valid form
      keepgoing = false;
      response = "{\"status\":\"failed\"}";

    } catch (IOException e) {
      // the connection couldn't be established
      keepgoing = false;
      response = "{\"status\":\"failed\"}";
    }

    if (keepgoing) {

      if (cached.equals("true")) {
        taskName = "performancecache";
      }

      position = perfQueueManager.storeMessage(url, taskName, random.toString(), email);
      //delete from imagetest
      try {
        java.sql.Connection con = postgresService.usePostgresDS();

        String query = "DELETE FROM imagedata;";
        PreparedStatement statement = con.prepareStatement(query);
        log.info("_____Clear the table for a new report.");
        statement.executeUpdate();
        statement.close();

      } catch (SQLException e) {
        e.printStackTrace();
      }
    } else {
      System.out.println("Bad URL");
      builder = Response.ok(response, MediaType.APPLICATION_JSON);
      return builder.build();

    }

    try {
      retVal = "{\"position\":" + position + ",\"uuid\":\"" + random.toString() + "\",\"email\":\"" + (email.isEmpty() ? "false" : "true") + "\"}";
    } catch (Exception e) {
      retVal = response;
    }

    builder = Response.ok(retVal, MediaType.APPLICATION_JSON);

    builder.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    builder.header("Access-Control-Allow-Origin", "*");
    builder.header("Access-Control-Allow-Headers", "accept, origin, sg-variant, content-type");

    return builder.build();


  }

  @GZIP
  @GET
  @Path("/checkimage")
  @Produces(MediaType.TEXT_HTML)
  public Response checkimage(@QueryParam("uuid") String uuid) {

    Response.ResponseBuilder builder = null;
    Map<String, String> responseObj = new HashMap<String, String>();

    String all = "";

    if(uuid == null || uuid.equals("null")){
      responseObj.put("error", "uuid cannot be null");
      builder = Response.status(Response.Status.BAD_REQUEST).entity(responseObj);
      return builder.build();
    }

    ResultSet rs = null;

    try {
      java.sql.Connection con = postgresService.usePostgresDS();
      String query = "SELECT * FROM imagedata WHERE data ->> ? > '1'";

      if(con != null){
        PreparedStatement statement = con.prepareStatement(query);
        statement.setString(1, uuid);
        rs = statement.executeQuery();
        try {

          all += "[";

          while(rs.next()){
            all += rs.getString("data");
            if(!rs.isLast()){
              all += ",";
            }
          }

          all += "]";

        } catch (SQLException e) {
          e.printStackTrace();
        }

        statement.close();
        builder = Response.status(Response.Status.OK).entity(all);
      }else{
        responseObj.put("error", "bad connection to DB");
        builder = Response.status(Response.Status.BAD_REQUEST).entity(responseObj);
      }

    } catch (SQLException e) {
      e.printStackTrace();
      responseObj.put("error", e.getMessage());
      builder = Response.status(Response.Status.BAD_REQUEST).entity(responseObj);
    }

    builder.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    builder.header("Access-Control-Allow-Origin", "*");
    builder.header("Access-Control-Allow-Headers", "accept, origin, sg-variant, content-type");

    return builder.build();
  }

  @GZIP
  @GET
  @Path("/report")
  @Produces(MediaType.APPLICATION_JSON)
//  @NotNull(message="uuid cannot be null") @Pattern(regexp = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",message="uuid must be in proper format")
  public Response report(@QueryParam("uuid") String uuid) {
    //todo - check to see what this uuid position is and multiply timeout
    Response.ResponseBuilder builder = null;
    Map<String, String> responseObj = new HashMap<String, String>();
    System.out.println("---------uuid poll--" + uuid);
    String all = "";

    if(uuid == null || uuid.equals("null")){
      responseObj.put("error", "uuid cannot be null");
      builder = Response.status(Response.Status.BAD_REQUEST).entity(responseObj);
      return builder.build();
    }

    ResultSet rs = null;

    try {
      java.sql.Connection con = postgresService.usePostgresDS();
      String query = "SELECT * FROM timingdata WHERE data -> ? > '1'";

      if(con != null){
        PreparedStatement statement = con.prepareStatement(query);
        statement.setString(1, uuid);
        rs = statement.executeQuery();
        try {

          all += "[";

          while(rs.next()){
            all += rs.getString("data");
            if(!rs.isLast()){
              all += ",";
            }
          }

          all += "]";

        } catch (SQLException e) {
          e.printStackTrace();
        }

        statement.close();
        builder = Response.status(Response.Status.OK).entity(all);
      }else{
        responseObj.put("error", "bad connection to DB");
        builder = Response.status(Response.Status.BAD_REQUEST).entity(responseObj);
      }



    } catch (SQLException e) {
      e.printStackTrace();
      responseObj.put("error", e.getMessage());
      builder = Response.status(Response.Status.BAD_REQUEST).entity(responseObj);
    }

    builder.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    builder.header("Access-Control-Allow-Origin", "*");
    builder.header("Access-Control-Allow-Headers", "accept, origin, sg-variant, content-type");

    return builder.build();
  }



  private Response.ResponseBuilder createViolationResponse(Set<ConstraintViolation<?>> violations) {
    log.fine("Validation completed. violations found: " + violations.size());

    Map<String, String> responseObj = new HashMap<String, String>();

    for (ConstraintViolation<?> violation : violations) {
      responseObj.put(violation.getPropertyPath().toString(), violation.getMessage());
    }

    return Response.status(Response.Status.BAD_REQUEST).entity(responseObj);
  }


}
