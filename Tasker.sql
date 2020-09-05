-- MySQL dump 10.13  Distrib 5.7.30, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: Tasker
-- ------------------------------------------------------
-- Server version	5.7.30-0ubuntu0.18.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `Tasker`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `Tasker` /*!40100 DEFAULT CHARACTER SET latin1 */;

USE `Tasker`;

--
-- Table structure for table `Tasks`
--

DROP TABLE IF EXISTS `Tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Tasks` (
  `taskID` int(11) NOT NULL AUTO_INCREMENT,
  `teamID` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` longtext,
  `priority` int(11) NOT NULL,
  `due_date` datetime NOT NULL,
  `complete_status` int(11) DEFAULT '0',
  `date_completed` datetime DEFAULT NULL,
  PRIMARY KEY (`taskID`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Tasks`
--

LOCK TABLES `Tasks` WRITE;
/*!40000 ALTER TABLE `Tasks` DISABLE KEYS */;
INSERT INTO `Tasks` VALUES (11,1,1,'Create a Web Application','The final submission, milestone 3.',2,'2020-07-27 12:00:00',0,NULL),(26,1,7,'Change password','Passwords are made secure via argon2 hash and salt.',2,'2020-08-04 16:00:00',0,NULL),(27,1,4,'Example: Walk the dog','Take the dog for a walk around the block.',1,'2020-07-20 13:00:00',0,NULL),(29,1,2,'Mark this task as completed','This is a test task made for the marker. It is mainly made to test the task completion button.',0,'2020-07-29 14:30:00',0,NULL),(30,1,1,'Take the bins out','Before the trucks come around the next morning',1,'2020-07-15 22:00:00',0,NULL),(32,1,2,'Wash the Dishes','Rinse then off and place them in the dishwasher.',1,'2020-07-24 20:00:00',0,NULL),(33,1,2,'Making a new task!','This is an example task to fill the screen for the marker',0,'2020-07-14 22:00:00',0,NULL),(40,2,2,'User Task','You cannot edit this task as you are only a user on this team. You can only complete this task.\nYou will also see on the Teams page, you cannot edit or delete this task.\nOr access the control buttons on the team page.',1,'2020-07-22 10:00:00',0,NULL),(41,2,4,'This is not your task','But you can see it in the team page.',1,'2020-07-21 03:08:00',0,NULL),(42,1,1,'This task is this week','',0,'2020-06-30 11:00:00',0,NULL),(44,2,1,'This task belongs to UserTeam','For testing',2,'2020-07-21 00:03:00',0,NULL);
/*!40000 ALTER TABLE `Tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TeamMemberships`
--

DROP TABLE IF EXISTS `TeamMemberships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `TeamMemberships` (
  `userID` int(11) NOT NULL,
  `teamID` int(11) NOT NULL,
  `is_manager` int(11) DEFAULT '0',
  PRIMARY KEY (`userID`,`teamID`),
  KEY `teamID` (`teamID`),
  CONSTRAINT `TeamMemberships_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `Users` (`userID`) ON DELETE CASCADE,
  CONSTRAINT `TeamMemberships_ibfk_2` FOREIGN KEY (`teamID`) REFERENCES `Teams` (`teamID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TeamMemberships`
--

LOCK TABLES `TeamMemberships` WRITE;
/*!40000 ALTER TABLE `TeamMemberships` DISABLE KEYS */;
INSERT INTO `TeamMemberships` VALUES (1,1,1),(1,2,0),(2,1,0),(2,2,0),(3,1,0),(4,1,0),(4,2,1),(6,1,0),(7,1,1);
/*!40000 ALTER TABLE `TeamMemberships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Teams`
--

DROP TABLE IF EXISTS `Teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Teams` (
  `teamID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `color` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`teamID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Teams`
--

LOCK TABLES `Teams` WRITE;
/*!40000 ALTER TABLE `Teams` DISABLE KEYS */;
INSERT INTO `Teams` VALUES (1,'ManagerTeam','#DC143C'),(2,'UserTeam','#008000');
/*!40000 ALTER TABLE `Teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Users` (
  `userID` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name_first` varchar(255) NOT NULL,
  `name_last` varchar(255) NOT NULL,
  `availability` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `display_picture` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` VALUES (1,'alby1234.p@gmail.com','$argon2i$v=19$m=4096,t=3,p=1$xQfNygpyYUp6VQ8lJblAFw$zC4kRY/gS7luPRithTwM9WRfkZDVGsSDhCm6C9/tIdA','New','Name','[true,true,true,true,true,false,false]','/public/images/users/default.png'),(2,'marking@wdc.com','$argon2i$v=19$m=4096,t=3,p=1$aa+6Sj8r6bvD1nDThlHtnQ$eKTh1hQQcjFAeSTE7qOpKV/WzfAqKEQviAeFyvmACz8','Bill','Foobar','[false, true, true, true, true, true, false]','/public/images/users/default.png'),(3,'test3@mail.com','$argon2i$v=19$m=4096,t=3,p=1$27MqenIOWQJgewHVxz/97Q$15KAP79mJjQVv69ad0JgRh7rguRHpuF44eva6myGw/4','Sarah','Pretend','[false, true, true, true, true, true, false]','/public/images/users/default.png'),(4,'test4@mail.com','$argon2i$v=19$m=4096,t=3,p=1$V8mp4uTiVFRxg3PACrjSqg$upxWn+lIPheHWiYNrM90KL1RSypsvXX2SKAGpIbNWDY','Carson','Nutreel','[false, true, true, true, true, true, false]','/public/images/users/default.png'),(5,'newUser@mail.com','$argon2i$v=19$m=4096,t=3,p=1$EIyCcQDgAlB+R0XQ3Cp9zQ$121HlHVg6cOkoylobTDzukrHPStKUN52g1RKISMAeg4','Queen','Elizabeth II','[false,true,true,true,true,true,false]','/public/images/users/default.png'),(6,'makinganotheraccount@mail.com','$argon2i$v=19$m=4096,t=3,p=1$kX8EeVk5l82HE7tvsFkVXg$R0i+W2ZEeTXqccbiWFW1v9IOt5bFAgykBeLcsCKeezI','Elvis','Presley','[false,true,true,true,true,true,false]','/public/images/users/default.png'),(7,'testing00@mail.com','$argon2i$v=19$m=4096,t=3,p=1$XhLKCChpPeLxykoivGfcJQ$rnX2BnHY+GhTwr0SNd1NKuoCstFceIPARw+uF6OYZnQ','Hello','Test','[true,true,true,true,true,true,true]','/public/images/users/default.png');
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-06-27  8:24:46
