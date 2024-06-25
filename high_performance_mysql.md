1. MySQL Architecture

2. Monitoring in a Reliability Engineering World

3. Performance Schema

4. Operating System and Hardware Optimization

5. Optimizing Server Settings

6. Schema Design and Management

7. Indexing for High Performance

8. Query Performance Optimization

9. Replication

10. Backup and Recovery

11. Scaling MySQL

12. MySQL in the Cloud

13. Compliance with MySQL

Upgrading mysql version:
  Verify target: Ensure the target system is not a production server taking traffic (read_only flag) and verify it hasn’t been upgraded already.
  Set downtime: Suppress monitoring alerts to avoid unnecessary notifications during the upgrade.
  Other preconditions: Shut down dependent services that may produce errors while MySQL is offline.
  Remove old packages: Uninstall current MySQL packages to avoid conflicts with new version packages.
  Install new packages: Install the new MySQL packages on your system.
  Start mysqld: Start the MySQL server.
  Run mysql_upgrade: For versions older than MySQL 8.0, run the mysql_upgrade process.
  Restart mysqld: Perform a clean restart of the MySQL server to ensure proper startup and configuration.
  Verify connection: Test the connection by running a basic query to confirm MySQL is operational.
  Restore disabled services: Re-enable any configuration management or monitoring tools.
  Clear downtime: Remove downtime status to monitor for any issues post-upgrade.
