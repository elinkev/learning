<?php

/**
 * Abstraction is extension of encapsulation, if encapsulation is hiding the information of the object - abstraction hides the implementation.
 * In other words - internal implementation of the object is hidden from the user.
 */
class Transaction
{
    private $amount;
    public function __construct(int $amount)
    {
        $this->amount = $amount;
    }

    public function process()
    {
        echo "Processing transaction $this->amount";
        $this->sendEmail();
        $this->saveToDb();
    }

    private function sendEmail() {}
    private function saveToDb() {}
}

$transaction = new Transaction(10);
$transaction->process(); // Does a bunch of logic within the objcet, but as a user all you care about that transaction is being processed.


