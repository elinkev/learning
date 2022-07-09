<?php

/**
 * Factory - Creates objects without exposing the instantiation logic to the client and Refers to the newly created object through a common interface.
 * Is a simplified version of Factory Method
 *
 * Factory Method - Defines an interface for creating objects, but let subclasses to decide which class to instantiate
 * and Refers to the newly created object through a common interface.
 *
 * Abstract Factory - Offers the interface for creating a family of related objects,
 * without explicitly specifying their classes.
 */
class Payment
{
    protected $amount;
    public function __construct(int $amount)
    {
        $this->amount = $amount;
    }

    public function process()
    {
        echo "Processing $this->amount$ payment <br/>";
    }
}

class PaymentFactory
{
    public function createpayment($amount)
    {
        return new Payment($amount);
    }
}
/** Instead of writing new Payment() you use factory to simplify the code */
$paymentFactory = new PaymentFactory();
$payment1 = $paymentFactory->createpayment(10);
$payment2 = $paymentFactory->createpayment(20);
$payment1->process();
$payment2->process();
