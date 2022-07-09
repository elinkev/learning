<?php

/**
 * Encapsulation is when data of the object is hidden from the user.
 *(Basically class with private members that can be accessed by getters/setters)
 */
class Payment
{
    private $amount;

    public function getAmount()
    {
        return $this->amount;
    }

    public function setAmount($amount)
    {
        $this->amount = $amount;
    }


}

$payment = new Payment();
$payment->setAmount(10);
//$encapsulation->amount = 'Test'; //Cant be accessed



