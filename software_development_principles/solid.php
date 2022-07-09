<?php
/**
 *
 * S - single responsibility - (don't put unnecessary logic into one class)
 * O - open for extension, closed for modification -
 *    (implement an interface to multiple classes and define method logic for each class,
 *     instead of copying same logic to each class and modifying parts of it)
 * L - liskov substitution - (don't use inheritance just to save a few lines)
 * I - interface segregation - (separate interface methods to other interfaces if you some some classes don't need those methods, keep interfaces small)
 * D - dependency inversion - (depend upon interfaces and not on concrete classes)
 *
 */

echo'<pre>';

/** single responsibility */
class Task
{
    public function downloadFile() {}
    public function parseFile() {}
    public function saveToDb() {} // No need to put more logic into the class
}

/** open for extension, closed for modification */
class AreaCalculator
{
    public function calcArea($object, $params)
    {
        /**
         * Instead of adding custom logic here with every new shape, better to create Shape interface and extend it
         */
    }
}
interface Shape
{
    public function calcArea();
}
class Rectangle implements Shape
{
    protected $width;
    protected $height;
    public function __construct($width, $height)
    {
        $this->width = $width;
        $this->height = $height;
    }

    public function calcArea()
    {
        return $this->width * $this->height;
    }
}
class Circle implements Shape
{
    const PIE = 3.14;
    protected $rad;
    public function __construct($rad)
    {
        $this->rad = $rad;
    }

    public function calcArea()
    {
        return self::PIE * pow($this->rad, 2);
    }
}
$rectangle = new Rectangle(2, 2);
$circle = new Circle(2);
var_dump($rectangle->calcArea());
var_dump($circle->calcArea());


/** liskov substitution */
class Square
{
    protected $width;
    protected $height;
    public function __construct($width, $height)
    {
        $this->width = $width;
        $this->height = $height;
    }
    public function calcArea() {
        return $this->width * $this->height;
    }
}
class Triangle extends Square
{
    /** Instead of extending square and taking its Height and Width properties, define your own properties */
}


/** interface segregation  */
interface Animal
{
    public function description();
    /**
     * Instead of implementing another PET method here, its better to create a separate Pet interface with pet() method
     * and add it to the Dog class
     */
}
interface Pet
{
    public function pet();
}
class Dog implements Animal
{
    public function description()
    {
        return 'I am dog';
    }
}
class Tiger implements Animal
{
    public function description()
    {
        return 'I am tiger';
    }
}

/** dependency inversion */
function writeToFileBad($device) {
    if ($device === 'printer') {
        return 'Write to printer';
    } else if ($device === 'usb') {
        return 'Write to USB';
    }
}
/** Instead depend on an interface, and logic in classes */
interface DeviceInterface
{
    public function write();
}
class Printer implements DeviceInterface
{
    public function write()
    {
        return 'Write to printer';
    }
}
class Usb implements DeviceInterface
{
    public function write()
    {
        return 'Write to USB';
    }
}
function writeToFileGood(DeviceInterface $device) {
    return $device->write();
}

$device1 = new Printer();
$device2 = new USB();
var_dump(writeToFileGood($device1));
var_dump(writeToFileGood($device2));
