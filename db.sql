-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.3.15-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for frutify
CREATE DATABASE IF NOT EXISTS `frutify` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `frutify`;

-- Dumping structure for table frutify.cart
CREATE TABLE IF NOT EXISTS `cart` (
  `CART_ID` int(11) NOT NULL AUTO_INCREMENT,
  `PRODUCT_ID` int(11) NOT NULL,
  `USER_ID` int(11) NOT NULL,
  `CART_QTY` int(11) NOT NULL,
  `CART_ADD_DATETIME` datetime DEFAULT NULL,
  PRIMARY KEY (`CART_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

-- Dumping data for table frutify.cart: ~3 rows (approximately)
INSERT INTO `cart` (`CART_ID`, `PRODUCT_ID`, `USER_ID`, `CART_QTY`, `CART_ADD_DATETIME`) VALUES
	(4, 2, 3, 1, '2023-06-12 16:24:21'),
	(5, 2, 3, 3, '2023-06-14 16:24:21'),
	(6, 1, 3, 2, '2023-06-13 16:24:21');

-- Dumping structure for table frutify.fruit
CREATE TABLE IF NOT EXISTS `fruit` (
  `FRUIT_ID` int(11) NOT NULL AUTO_INCREMENT,
  `FRUIT_NAME` varchar(50) NOT NULL,
  PRIMARY KEY (`FRUIT_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

-- Dumping data for table frutify.fruit: ~2 rows (approximately)
INSERT INTO `fruit` (`FRUIT_ID`, `FRUIT_NAME`) VALUES
	(1, 'Apel'),
	(2, 'Pisang'),
	(3, 'Jeruk');

-- Dumping structure for table frutify.predict
CREATE TABLE IF NOT EXISTS `predict` (
  `PREDICT_ID` int(11) NOT NULL AUTO_INCREMENT,
  `PREDICT_FILENAME` varchar(100) NOT NULL,
  `FRUIT_ID` int(11) NOT NULL,
  `PREDICT_QUALITY` varchar(50) NOT NULL,
  `PREDICT_PRICE` int(11) NOT NULL,
  PRIMARY KEY (`PREDICT_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table frutify.predict: ~0 rows (approximately)

-- Dumping structure for table frutify.product
CREATE TABLE IF NOT EXISTS `product` (
  `PRODUCT_ID` int(11) NOT NULL AUTO_INCREMENT,
  `FRUIT_ID` int(11) NOT NULL,
  `USER_ID` int(11) NOT NULL,
  `PRODUCT_NAME` varchar(50) NOT NULL,
  `PRODUCT_DESCRIPTION` text NOT NULL,
  `PRODUCT_PRICE` int(11) NOT NULL,
  `PRODUCT_UNIT` varchar(50) NOT NULL,
  `PRODUCT_QUALITY` varchar(50) NOT NULL,
  `PRODUCT_FILE_PATH` varchar(50) NOT NULL,
  PRIMARY KEY (`PRODUCT_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

-- Dumping data for table frutify.product: ~2 rows (approximately)
INSERT INTO `product` (`PRODUCT_ID`, `FRUIT_ID`, `USER_ID`, `PRODUCT_NAME`, `PRODUCT_DESCRIPTION`, `PRODUCT_PRICE`, `PRODUCT_UNIT`, `PRODUCT_QUALITY`, `PRODUCT_FILE_PATH`) VALUES
	(1, 1, 1, 'Apel Segar', 'Apel segar kualitas debes', 30000, 'kg', 'GOOD', '-'),
	(2, 1, 1, 'Apel Segar', 'Apel segar kualitas lumayan', 25000, 'kg', 'GOOD', '-');

-- Dumping structure for table frutify.user
CREATE TABLE IF NOT EXISTS `user` (
  `USER_ID` int(11) NOT NULL AUTO_INCREMENT,
  `USER_EMAIL` varchar(50) NOT NULL,
  `USER_PHONE` varchar(50) NOT NULL,
  `USER_PASSWORD` varchar(50) NOT NULL,
  `USER_FULLNAME` varchar(50) NOT NULL,
  `USER_ROLE` varchar(10) NOT NULL,
  `USER_ADDRESS` text NOT NULL,
  `USER_TOKEN` varchar(255) NOT NULL,
  `USER_TOKEN_EXPIRED` varchar(30) NOT NULL,
  PRIMARY KEY (`USER_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

-- Dumping data for table frutify.user: ~2 rows (approximately)
INSERT INTO `user` (`USER_ID`, `USER_EMAIL`, `USER_PHONE`, `USER_PASSWORD`, `USER_FULLNAME`, `USER_ROLE`, `USER_ADDRESS`, `USER_TOKEN`, `USER_TOKEN_EXPIRED`) VALUES
	(1, 'badrul@gmail.com', '081215992673', '12345678', 'Badrul Akbar A M', 'SELLER', '', '', ''),
	(3, 'akbar@gmail.com', '08122345', '12345678', '12345678', 'BUYER', 'jl 123 oke', '', '');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
