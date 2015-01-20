package com.fluxui.service;

import javax.annotation.Resource;
import javax.ejb.Stateless;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.enterprise.inject.Produces;
import javax.persistence.PersistenceUnit;
import javax.sql.DataSource;
import java.sql.*;

@Stateless
public class DBService {

  @Resource(name="postgresDS", mappedName="java:jboss/datasources/postgresDS")
  private DataSource dataSource;

  Connection connection = null;

  @TransactionAttribute(TransactionAttributeType.REQUIRED)
  public Connection usePostgresDS() throws SQLException {
    try {
      if(connection == null){
        connection = dataSource.getConnection("postgres","postgres");
      }
    } catch (Exception e) {
      // handle exceptions
      e.printStackTrace();
    } finally {
    }
    return connection;
  }



//  @Resource(name="CassandraDS", mappedName="java:jboss/datasources/CassandraDS")
//	private DataSource dataSource;
//
//	@TransactionAttribute(TransactionAttributeType.NOT_SUPPORTED)
//	public Connection useCassandraDS() throws SQLException {
//		Connection connection = null;
//		try {
//
//			connection = dataSource.getConnection();
//			System.out.println("--useCassandraDS---");
//		} catch (Exception e) {
//			// handle exceptions
//
//		} finally {
//			// close statements, connections
//		}
//		return connection;
//	}

//	try
//	{
//
//		Class.forName("org.apache.cassandra.cql.jdbc.CassandraDriver");
//		Connection conn = DriverManager.getConnection("jdbc:cassandra://localhost:9160/system?version=3.0.0");
//
//		if (conn != null)
//		{
//			System.out.println("Connected");
//		}
//
//		//String sql = "INSERT INTO employee (eid,eadd,ename,esal,sex) VALUES (2499,'bangalore','amit',10000,'male')";
//		Statement stmt = conn.createStatement();
//
//		//stmt.execute(sql);
//		System.out.println("ABC");
//		String sql="select * from demo.users";
//		ResultSet rs=stmt.executeQuery(sql);
//		//System.out.println(rs);
//		//System.out.println("value inserted");
//		while(rs.next())
//		{
//
//			System.out.println("id="+rs.getString(1));
//
//			System.out.println();
//
//		}
//
//	} catch (SQLException e) {
//		e.printStackTrace();
//	} catch (ClassNotFoundException e) {
//		e.printStackTrace();
//	}

}
