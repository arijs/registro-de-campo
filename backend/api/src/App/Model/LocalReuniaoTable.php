<?php

namespace App\Model;

use RuntimeException;
use Zend\Db\TableGateway\TableGatewayInterface;
use Zend\Db\Sql\Select;

class LocalReuniaoTable
{
    private $tableGateway;

    public static $model = LocalReuniao::class;
    public static $tableName = 'locais_reuniao';

    public static function create() {
        return new self::$model();
    }

    public function __construct(TableGatewayInterface $tableGateway)
    {
        $this->tableGateway = $tableGateway;
    }

    public function fetchAll()
    {
        return $this->tableGateway->select();
    }

    public function fetchAllArray()
    {
        $rowset = $this->fetchAll();
        $list = [];
        foreach ($rowset as $row) {
            $list[] = $row;
        }
        return $list;
    }

    public function fetchOffsetLimit($offset, $limit)
    {
        return $this->tableGateway->select(function (Select $select) use ($offset, $limit) {
            $select->offset($offset)->limit($limit);
        });
    }

    public function countAll()
    {
        $sql = $this->tableGateway->getSql();
        $select = $sql->select();
        $select->columns(array('count' => new \Zend\Db\Sql\Expression('COUNT(*)')));
        $statement = $sql->prepareStatementForSqlObject($select);
        $rowset = $statement->execute();
        $row = $rowset->current();
        if (! $row) {
            throw new RuntimeException(
                'Could not count table rows'
            );
        }

        return $row;
    }

    public function getLocalReuniao($id)
    {
        $id = (int) $id;
        $rowset = $this->tableGateway->select(['reuniao_id' => $id]);
        $row = $rowset->current();
        if (! $row) {
            throw new RuntimeException(sprintf(
                'Could not find row with identifier %d',
                $id
            ));
        }

        return $row;
    }

    public function getReuniaoByGeoId($geo_id)
    {
        $rowset = $this->tableGateway->select(['geo_id' => $geo_id]);
        return $rowset->current();
    }

    public function getReuniaoByOrgId($org_id)
    {
        $rowset = $this->tableGateway->select(['org_id' => $org_id]);
        return $rowset->current();
    }

    public function saveLocalReuniao(LocalReuniao $reuniao)
    {
        $id = (int) $reuniao->reuniao_id;

        if ($id === 0) {
            return $this->insertLocalReuniao($reuniao);
        }

        return $this->updateLocalReuniao($reuniao);
    }

    public function insertLocalReuniao(LocalReuniao $reuniao)
    {
        $reuniao->inserido = $reuniao->checkDate(date('Y-m-d H:i:s'));
        $reuniao->atualizado = ['original' => 0];
        $this->tableGateway->insert($reuniao->toArray());
        $reuniao->reuniao_id = $this->tableGateway->getLastInsertValue();
    }

    public function updateLocalReuniao(LocalReuniao $reuniao)
    {
        $reuniao->atualizado = $reuniao->checkDate(date('Y-m-d H:i:s'));
        $array = $reuniao->toArray();
        unset($array['inserido']);
        $this->tableGateway->update(
            $array,
            ['reuniao_id' => (int) $reuniao->reuniao_id]
        );
    }

    public function deleteLocalReuniao($id)
    {
        $this->tableGateway->delete(['reuniao_id' => (int) $id]);
    }
}
